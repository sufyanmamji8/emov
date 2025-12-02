import React, { useState, useEffect } from 'react';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import PropTypes from 'prop-types';
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';

// Country formats and examples
const getCountryFormat = (countryCode) => {
  const formats = {
    PK: '3XXXXXXXXX',
    US: '(XXX) XXX-XXXX',
    GB: 'XXXX XXX XXXX',
    IN: 'XXXXXXXXXX',
    AE: '5X XXX XXXX',
    SA: '5X XXX XXXX',
    default: 'Enter phone number'
  };
  return formats[countryCode] || formats.default;
};

// Get the placeholder text with country code and format
const getPlaceholder = (countryCode, defaultCountry = 'PK') => {
  const code = countryCode || defaultCountry;
  try {
    const callingCode = getCountryCallingCode(code);
    const format = getCountryFormat(code);
    return `+${callingCode} ${format}`;
  } catch (e) {
    // Fallback to default if country code is invalid
    const callingCode = getCountryCallingCode(defaultCountry);
    const format = getCountryFormat(defaultCountry);
    return `+${callingCode} ${format}`;
  }
};

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
  return map[countryCode] || 15; // default 8-15 in validation
};

// Prevent typing more digits than allowed for the selected country
const enforceMaxLength = (phone, countryCode) => {
  if (!phone) return phone;

  const code = countryCode || 'PK';

  try {
    const callingCode = getCountryCallingCode(code);
    const digits = phone.replace(/\D/g, '');

    const stripCode = (value) =>
      value.startsWith(callingCode) ? value.slice(callingCode.length) : value;

    const national = stripCode(digits);
    const maxNational = getMaxDigitsForCountry(code);

    if (national.length <= maxNational) {
      return phone;
    }

    // Truncate national digits to the allowed maximum
    const limitedNational = national.slice(0, maxNational);
    return `+${callingCode}${limitedNational}`;
  } catch (e) {
    return phone;
  }
};

const CustomPhoneInput = ({
  name,
  value = '',
  onChange,
  onCountryChange,
  error,
  defaultCountry = "PK",
  label = "Phone Number",
  placeholder = "Enter phone number",
  required = false,
  labelName = true,
  ...props
}) => {
  const [phoneData, setPhoneData] = useState({ phone: "", isValid: false });
  const [currentCountry, setCurrentCountry] = useState(defaultCountry);
  const [validation, setValidation] = useState({ isValid: false, message: '' });
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value) {
      validatePhoneNumber(value, currentCountry);
    }
  }, [value, currentCountry]);

  const handleChange = (phone) => {
    const limitedPhone = enforceMaxLength(phone, currentCountry);
    if (onChange) {
      onChange(limitedPhone);
    }
  };

  const handleCountryChange = (countryCode) => {
    if (countryCode && countryCode !== currentCountry) {
      setCurrentCountry(countryCode);
      if (onCountryChange) {
        onCountryChange(countryCode);
      }
      // Re-validate with new country
      if (value) {
        validatePhoneNumber(value, countryCode);
      }
    }
  };

  const getValidationMessage = (phone, countryCode) => {
    if (!phone) return 'Phone number is required';
    
    const phoneNumber = phone.replace(/\D/g, ''); // Remove all non-digits
    
    // Country-specific validation
    const validations = {
      PK: {
        pattern: /^3[0-9]{9}$/,
        message: 'Must be 10 digits starting with 3',
        example: '3XXXXXXXXX'
      },
      US: {
        pattern: /^[0-9]{10}$/,
        message: 'Must be 10 digits',
        example: '(XXX) XXX-XXXX'
      },
      GB: {
        pattern: /^[0-9]{10,11}$/,
        message: 'Must be 10-11 digits',
        example: 'XXXX XXX XXXX'
      },
      IN: {
        pattern: /^[6-9][0-9]{9}$/,
        message: 'Must be 10 digits starting with 6-9',
        example: 'XXXXXXXXXX'
      },
      AE: {
        pattern: /^5[0-9]{8}$/,
        message: 'Must be 9 digits starting with 5',
        example: '5X XXX XXXX'
      },
      SA: {
        pattern: /^5[0-9]{8}$/,
        message: 'Must be 9 digits starting with 5',
        example: '5X XXX XXXX'
      }
    };

    const validation = validations[countryCode] || {
      pattern: /^[0-9]{8,15}$/,
      message: 'Must be 8-15 digits',
      example: 'XXXXXXXX'
    };

    if (!validation.pattern.test(phoneNumber)) {
      return validation.message + ` (e.g., ${validation.example})`;
    }

    return '';
  };

  const validatePhoneNumber = (phone, countryCode) => {
    if (!phone) {
      setValidation({ isValid: false, message: 'Phone number is required' });
      return false;
    }

    try {
      const phoneNumber = parsePhoneNumberFromString(phone, countryCode);
      const isValid = phoneNumber?.isValid() || false;
      const message = getValidationMessage(phone, countryCode);
      
      setValidation({
        isValid: message === '',
        message: message
      });

      return message === '';
    } catch (error) {
      const message = getValidationMessage(phone, countryCode);
      setValidation({
        isValid: false,
        message: message || 'Invalid phone number format'
      });
      return false;
    }
  };

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <PhoneInput
          international
          defaultCountry={defaultCountry}
          value={value}
          onChange={handleChange}
          onCountryChange={handleCountryChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-2.5 text-base 
            border ${error ? 'border-red-500' : 'border-gray-300'} 
            rounded-md 
            focus:outline-none focus:ring-0 focus:border-emov-purple focus:ring-0
            transition-all duration-200
            bg-white
            [&>input]:!border-none [&>input]:!ring-0 [&>input]:!ring-offset-0 [&>input]:focus:!ring-0 [&>input]:focus:!ring-offset-0
          `}
          placeholder={getPlaceholder(currentCountry, defaultCountry)}
          error={error}
          {...props}
        />
      </div>
      
      {(error || validation.message) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-yellow-600'}`}>
          {error || validation.message}
        </p>
      )}
      {validation.isValid && value && (
        <p className="mt-1 text-sm text-green-600">
          ✓ Valid phone number
        </p>
      )}
    </div>
  );
};

CustomPhoneInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onCountryChange: PropTypes.func,
  error: PropTypes.string,
  defaultCountry: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  labelName: PropTypes.bool,
};

export default CustomPhoneInput;