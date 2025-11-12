import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/AuthApi';
import CustomPhoneInput from './CustomPhoneInput';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    countryCode: 'PK'  // Store country code in formData
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: ''
  });
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Country codes with Pakistan as default
  const countryCodes = [
    { code: '+92', flag: '🇵🇰', name: 'Pakistan', whatsapp: true },
    { code: '+1', flag: '🇺🇸', name: 'United States', whatsapp: true },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom', whatsapp: true },
    { code: '+91', flag: '🇮🇳', name: 'India', whatsapp: true },
    { code: '+86', flag: '🇨🇳', name: 'China', whatsapp: false },
    { code: '+971', flag: '🇦🇪', name: 'UAE', whatsapp: true },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', whatsapp: true },
    { code: '+20', flag: '🇪🇬', name: 'Egypt', whatsapp: true },
    { code: '+27', flag: '🇿🇦', name: 'South Africa', whatsapp: true },
    { code: '+61', flag: '🇦🇺', name: 'Australia', whatsapp: true },
    { code: '+64', flag: '🇳🇿', name: 'New Zealand', whatsapp: true },
    { code: '+33', flag: '🇫🇷', name: 'France', whatsapp: true },
    { code: '+49', flag: '🇩🇪', name: 'Germany', whatsapp: true },
    { code: '+39', flag: '🇮🇹', name: 'Italy', whatsapp: true },
    { code: '+34', flag: '🇪🇸', name: 'Spain', whatsapp: true },
    { code: '+7', flag: '🇷🇺', name: 'Russia', whatsapp: false },
    { code: '+81', flag: '🇯🇵', name: 'Japan', whatsapp: true },
    { code: '+82', flag: '🇰🇷', name: 'South Korea', whatsapp: true },
    { code: '+65', flag: '🇸🇬', name: 'Singapore', whatsapp: true },
    { code: '+60', flag: '🇲🇾', name: 'Malaysia', whatsapp: true },
  ];

  const validatePassword = (password) => {
    const validations = {
      length: password.length >= 8 && password.length <= 20,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*_+=\-`~(){}[\]|;:'"<>,.?/]/.test(password)
    };
    setPasswordValidation(validations);
    
    // Only show error if there's some input and it's not valid
    if (password && !Object.values(validations).every(Boolean)) {
      const missingRequirements = [];
      if (!validations.length) missingRequirements.push('8-20 characters');
      if (!validations.lowercase) missingRequirements.push('one lowercase letter');
      if (!validations.uppercase) missingRequirements.push('one uppercase letter');
      if (!validations.number) missingRequirements.push('one number');
      if (!validations.specialChar) missingRequirements.push('one special character (!@#$%^&*_+=-()<>)');
      
      setFieldErrors(prev => ({
        ...prev,
        password: `Password must contain: ${missingRequirements.join(', ')}`
      }));
    } else if (password) {
      setFieldErrors(prev => ({
        ...prev,
        password: ''
      }));
    }
    
    return Object.values(validations).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);

    if (name === 'password') {
      validatePassword(value);
      // Clear the error if all validations pass
      if (Object.values(passwordValidation).every(Boolean)) {
        setFieldErrors(prev => ({
          ...prev,
          password: ''
        }));
      }
    } else if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    setError('');
  };

  const handleCountrySelect = (country) => {
    setFormData({
      ...formData,
      countryCode: country.code
    });
    setShowCountryDropdown(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.mobileNumber) {
      errors.mobileNumber = 'Mobile number is required';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else {
      const isPasswordValid = validatePassword(formData.password);
      if (!isPasswordValid) {
        errors.password = 'Password does not meet all requirements';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const signupData = {
        ...formData,
        countryCode: formData.countryCode || 'PK' // Default to 'PK' if not set
      };
      
      const response = await authApi.signup(signupData);
      
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please login.' 
        },
        replace: true
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error.response) {
        if (error.response.data?.errors) {
          const serverErrors = {};
          Object.keys(error.response.data.errors).forEach(key => {
            serverErrors[key] = error.response.data.errors[key][0];
          });
          setFieldErrors(serverErrors);
        } else if (error.response.data?.message) {
          setError(error.response.data.message);
        } else {
          setError('Signup failed. Please try again.');
        }
      } else if (error.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError(error.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden no-scrollbar bg-bg-primary">
      {/* Left side - Brand Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative overflow-hidden" 
        style={{ background: 'var(--emov-gradient)' }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emov-purple rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-emov-green rounded-full animate-bounce"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-emov-purple rounded-full animate-ping"></div>
        </div>
        
        <div className="max-w-md text-text-primary text-center relative z-10 flex flex-col items-center">
          <img 
            src="/emovlogo.png" 
            alt="Emov Logo" 
            className="w-40 h-40 mb-6 animate-fade-in"
          />
          <div className="mb-4 animate-fade-in w-48">
            <img 
              src="/emovfont.png" 
              alt="Emov" 
              className="w-full h-auto"
            />
          </div>
          <p className="text-2xl font-light mb-6 animate-slide-up text-text-secondary">Buy & Sell Vehicles</p>
        </div>
        
        <div className="w-full animate-fade-in flex flex-col items-center">
          <div className="w-24 h-24 -mt-2 bg-bg-secondary rounded-full p-2">
            <img 
              src="/loginemov.png" 
              alt="Emov" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-text-secondary mt-2">Sell your vehicle with ease</p>
        </div>
      </div>
      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start pt-12 p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 w-full">
            <h2 className="text-xl font-medium text-text-primary mb-1">Create Account</h2>
            <p className="text-xs text-text-tertiary">Join us and start your journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-base font-normal text-text-primary dark:text-gray-200 mb-1">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 text-base text-text-primary border ${
                  fieldErrors.fullName ? 'border-red-500' : 'border-border-primary hover:border-border-secondary'
                } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-primary transition-all duration-300`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-base font-normal text-text-primary dark:text-gray-200 mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 text-base text-text-primary border ${
                  fieldErrors.email ? 'border-red-500' : 'border-border-primary hover:border-border-secondary'
                } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-primary transition-all duration-300`}
                placeholder="Enter your email"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Mobile Number Field */}
            <CustomPhoneInput
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  mobileNumber: value
                }));
              }}
              onCountryChange={(countryCode) => {
                setFormData(prev => ({
                  ...prev,
                  countryCode
                }));
              }}
              error={fieldErrors.mobileNumber}
              label="Mobile Number"
              required
            />

            {/* Password Field */}
            <div>
              <label className="block text-base font-normal text-text-primary dark:text-gray-200 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 pr-10 text-base text-text-primary border ${
                    fieldErrors.password ? 'border-red-500' : 'border-border-primary hover:border-border-secondary'
                  } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-primary transition-all duration-300`}
                  placeholder="Create a password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-700 font-medium mb-1">Password must contain:</p>
                <ul className="space-y-1 text-sm">
                  <li className={passwordValidation.length ? 'text-gray-400' : 'text-red-600'}>
                    {passwordValidation.length ? '✓' : '•'} 8-20 characters
                  </li>
                  <li className={passwordValidation.lowercase ? 'text-gray-400' : 'text-red-600'}>
                    {passwordValidation.lowercase ? '✓' : '•'} At least one lowercase letter (a-z)
                  </li>
                  <li className={passwordValidation.uppercase ? 'text-gray-400' : 'text-red-600'}>
                    {passwordValidation.uppercase ? '✓' : '•'} At least one uppercase letter (A-Z)
                  </li>
                  <li className={passwordValidation.number ? 'text-gray-400' : 'text-red-600'}>
                    {passwordValidation.number ? '✓' : '•'} At least one number (0-9)
                  </li>
                  <li className={passwordValidation.specialChar ? 'text-gray-400' : 'text-red-600'}>
                    {passwordValidation.specialChar ? '✓' : '•'} At least one special character: {'!@#$%^&*_+=-`~()[]{}|;:\'\",.<>/?'}
                  </li>
                </ul>
                {Object.values(passwordValidation).every(Boolean) && (
                  <p className="mt-2 text-sm text-green-600 font-medium">✓ Password meets all requirements</p>
                )}
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Sign Up Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-emov-purple text-white rounded-lg font-medium hover:bg-emov-purple-dark transition-colors focus:outline-none focus:ring-2 focus:ring-emov-purple focus:ring-opacity-50 flex items-center justify-center space-x-2 dark:bg-emov-purple-light dark:hover:bg-emov-purple"
              style={{ 
                background: 'var(--emov-gradient)',
                border: 'none'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary dark:text-gray-300 text-center">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-emov-purple hover:text-emov-purple-dark transition-colors dark:text-emov-purple-light"
                style={{
                  backgroundImage: 'var(--emov-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;