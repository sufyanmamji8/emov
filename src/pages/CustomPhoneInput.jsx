import React, { useState, useEffect, useRef } from 'react';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import PropTypes from 'prop-types';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Maximum national digits per country (excluding country calling code)
const getMaxDigitsForCountry = (countryCode) => {
  const map = {
    PK: 10, // 3XXXXXXXXX
    US: 10,
    GB: 11,
    IN: 10,
    AE: 9,
    SA: 9,
  };
  return map[countryCode] || 15;
};

// Get maximum total digits including country code
const getMaxTotalDigitsForCountry = (countryCode) => {
  try {
    const callingCode = getCountryCallingCode(countryCode);
    const nationalDigits = getMaxDigitsForCountry(countryCode);
    return callingCode.length + nationalDigits;
  } catch (e) {
    return 15;
  }
};

// Count only digits in a string
const countDigits = (str) => {
  return (str.match(/\d/g) || []).length;
};

// Strict enforcement: returns true if adding would exceed max
const wouldExceedMaxDigits = (currentValue, newChar, countryCode) => {
  const currentDigits = countDigits(currentValue);
  const newCharIsDigit = /\d/.test(newChar);
  
  if (!newCharIsDigit) return false; // Non-digits don't count against limit
  
  const maxDigits = getMaxTotalDigitsForCountry(countryCode);
  return currentDigits >= maxDigits;
};

const CustomPhoneInput = ({
  value = '',
  onChange,
  onCountryChange,
  error = '',
  label,
  required = false,
  defaultCountry = 'PK',
  disabled = false,
  onBlur
}) => {
  const [currentCountry, setCurrentCountry] = useState(defaultCountry);
  const [isTouched, setIsTouched] = useState(false); // Renamed variable to isTouched
  const inputRef = useRef(null);
  const isProgrammaticChange = useRef(false);

  const handleChange = (phone) => {
    if (isProgrammaticChange.current) {
      isProgrammaticChange.current = false;
      return;
    }

    // Mark as touched when user starts typing
    if (!isTouched && phone) {
      setIsTouched(true);
    }

    if (!phone) {
      if (onChange) onChange('');
      return;
    }

    // Count digits
    const digitCount = countDigits(phone);
    const maxDigits = getMaxTotalDigitsForCountry(currentCountry);
    
    // If exceeds max digits, truncate
    if (digitCount > maxDigits) {
      // Remove extra digits
      let newPhone = '';
      let digitsFound = 0;
      
      for (let i = 0; i < phone.length; i++) {
        const char = phone[i];
        newPhone += char;
        
        if (/\d/.test(char)) {
          digitsFound++;
          if (digitsFound >= maxDigits) {
            // Found max digits, stop here
            newPhone = phone.slice(0, i + 1);
            break;
          }
        }
      }
      
      isProgrammaticChange.current = true;
      if (onChange) onChange(newPhone);
      return;
    }
    
    if (onChange) onChange(phone);
  };

  const handleCountryChange = (countryCode) => {
    if (countryCode && countryCode !== currentCountry) {
      setCurrentCountry(countryCode);
      if (onCountryChange) onCountryChange(countryCode);
    }
  };

  // Intercept all keyboard input
  const handleKeyDown = (e) => {
    // Allow all control/editing keys
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const isControlKey = allowedControlKeys.includes(e.key);
    const isModifierKey = e.ctrlKey || e.metaKey || e.altKey;
    
    // Allow control keys and modifier combos (Ctrl+A, Ctrl+V, etc.)
    if (isControlKey || isModifierKey) {
      return;
    }
    
    // Get the actual input element
    const inputElement = inputRef.current?.querySelector('input');
    if (!inputElement) return;
    
    const currentValue = inputElement.value || '';
    const selectionStart = inputElement.selectionStart;
    const selectionEnd = inputElement.selectionEnd;
    
    // Check if this key would add a digit
    const isDigit = /^\d$/.test(e.key);
    
    if (isDigit && wouldExceedMaxDigits(currentValue, e.key, currentCountry)) {
      e.preventDefault();
      return;
    }
    
    // Check for paste (Ctrl+V) after the fact
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      // We'll handle this in onPaste event
      return;
    }
  };

  // Handle all input events
  const handleBeforeInput = (e) => {
    const inputElement = e.target;
    const currentValue = inputElement.value || '';
    const data = e.data;
    
    // If no data (like delete/backspace), allow it
    if (!data) return;
    
    // Check if this input would add a digit
    const wouldAddDigit = /\d/.test(data);
    
    if (wouldAddDigit && wouldExceedMaxDigits(currentValue, data, currentCountry)) {
      e.preventDefault();
      return;
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    
    const inputElement = e.target;
    const currentValue = inputElement.value || '';
    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    
    // Get digits from pasted text
    const pastedDigits = pastedText.replace(/\D/g, '');
    
    // Calculate current digit count
    const currentDigits = countDigits(currentValue);
    const maxDigits = getMaxTotalDigitsForCountry(currentCountry);
    const availableDigits = Math.max(0, maxDigits - currentDigits);
    
    // Take only as many digits as available
    const allowedDigits = pastedDigits.slice(0, availableDigits);
    
    if (!allowedDigits) return;
    
    // Insert digits at cursor position
    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    
    // We need to insert the digits while maintaining formatting
    // For simplicity, we'll let the library handle formatting
    const selectionDigitsBefore = countDigits(before);
    const newValue = before + allowedDigits + after;
    
    // Truncate if still over limit
    const newDigitCount = countDigits(newValue);
    if (newDigitCount > maxDigits) {
      // This shouldn't happen but just in case
      let finalValue = '';
      let digitsFound = 0;
      
      for (let i = 0; i < newValue.length; i++) {
        const char = newValue[i];
        finalValue += char;
        
        if (/\d/.test(char)) {
          digitsFound++;
          if (digitsFound >= maxDigits) {
            finalValue = newValue.slice(0, i + 1);
            break;
          }
        }
      }
      
      isProgrammaticChange.current = true;
      if (onChange) onChange(finalValue);
    } else {
      isProgrammaticChange.current = true;
      if (onChange) onChange(newValue);
    }
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    if (!phone) return 'Phone number is required';
    
    try {
      const phoneNumber = parsePhoneNumberFromString(phone, currentCountry);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return 'Invalid phone number';
      }
      return '';
    } catch (error) {
      return 'Invalid phone number format';
    }
  };

  const validationError = isTouched ? validatePhoneNumber(value) : '';

  const handleBlur = () => {
    setIsTouched(true);
    if (onBlur) onBlur();
  };

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div 
        ref={inputRef}
        className="relative"
        onKeyDown={handleKeyDown}
      >
        <PhoneInput
          international
          withCountryCallingCode
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          value={value}
          onChange={handleChange}
          onCountryChange={handleCountryChange}
          limitMaxLength={false}
          addInternationalOption={false}
          inputProps={{
            onBeforeInput: handleBeforeInput,
            onPaste: handlePaste,
            onBlur: handleBlur,
            inputMode: 'tel',
            autoComplete: 'tel',
            // Add direct event listeners to the input
            ref: (node) => {
              if (node) {
                // Remove any existing listeners to avoid duplicates
                node.onkeydown = handleKeyDown;
              }
            }
          }}
          className={`
            w-full px-4 py-2.5 text-base 
            border ${error || validationError ? 'border-red-500' : 'border-gray-300'} 
            rounded-md 
            focus:outline-none focus:ring-0 focus:border-blue-500
            transition-all duration-200
            bg-white
            [&>input]:!border-none [&>input]:!ring-0 [&>input]:!ring-offset-0 
            [&>input]:focus:!ring-0 [&>input]:focus:!ring-offset-0
            [&>input]:!outline-none
          `}
          placeholder={`Enter phone number for ${currentCountry}`}
        />
      </div>
      
      {/* Only show error message on blur or when explicitly invalid */}
      {validationError && value && (
        <p className="mt-1 text-sm text-red-600">
          {validationError}
        </p>
      )}
    </div>
  );
};

CustomPhoneInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onCountryChange: PropTypes.func,
  error: PropTypes.string,
  defaultCountry: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
};

export default CustomPhoneInput;