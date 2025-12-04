import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/AuthApi';
import CustomPhoneInput from './CustomPhoneInput';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    countryCode: 'PK'
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
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();

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
      if (!validations.specialChar) missingRequirements.push('one special character');
      
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
      // Show requirements only when user starts typing in password field
      if (value && !showPasswordRequirements) {
        setShowPasswordRequirements(true);
      }
      validatePassword(value);
    } else if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    setError('');
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
        countryCode: formData.countryCode || 'PK'
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-bg-primary">
      {/* Left Section - Decorative Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white overflow-hidden">
        {/* Gradient at top-left */}
        <div className="absolute top-0 left-0 w-80 h-80">
          <img 
            src="/topleftauth.png" 
            alt="Gradient Left" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Gradient at bottom-right */}
        <div className="absolute bottom-0 right-0 w-80 h-80">
          <img 
            src="/bottomrightauth.png" 
            alt="Gradient Right Bottom" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <div className="w-36 h-36">
            <img 
              src="/emovlogo.png" 
              alt="Emov Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-32">
            <img 
              src="/emovfont.png" 
              alt="Emov" 
              className="w-full h-auto"
            />
          </div>
          <h2 className="text-gray-600 text-sm font-medium">Buy and Sell Vehicles</h2>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center relative overflow-hidden">
        {/* Top Section with both logos */}
        <div className="w-full h-96 flex flex-col items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: 'url(/authpattern.png)' }}>
          {/* Small emovfont.png at the top */}
          <div className="absolute top-16">
            <img 
              src="/emovlogowhite.png" 
              alt="Emov" 
              className="h-8 object-contain"
            />
          </div>
          {/* Main signupemov.png in the center */}
          <div className="absolute -mt-8 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <img 
              src="/signupemov.png" 
              alt="Emov" 
              className="h-24 object-contain"
            />
          </div>
        </div>
        
        {/* Signup Card */}
        <div className="w-full max-w-xl bg-white rounded-3xl -mt-56 p-8 z-10 shadow-lg border border-gray-100 shadow-gray-400/30">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mt-2 text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-600">Join us to start your journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-normal text-text-primary mb-1">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm text-text-primary border ${
                  fieldErrors.fullName ? 'border-red-500' : 'border-border-primary hover:border-border-secondary'
                } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-secondary transition-all duration-300`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-normal text-text-primary mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm text-text-primary border ${
                  fieldErrors.email ? 'border-red-500' : 'border-border-primary hover:border-border-secondary'
                } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-secondary transition-all duration-300`}
                placeholder="Enter your email"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
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
              <label className="block text-sm font-normal text-text-primary mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 text-sm text-text-primary border ${
                    fieldErrors.password ? 'border-red-500' : 'border-border-primary hover:border-border-secondary'
                  } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-secondary transition-all duration-300`}
                  placeholder="Create a password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Requirements - Only show when user starts typing */}
              {showPasswordRequirements && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-700 font-medium mb-1">Password must contain:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={passwordValidation.length ? 'text-green-600' : 'text-red-600'}>
                      {passwordValidation.length ? '✓' : '•'} 8-20 characters
                    </li>
                    <li className={passwordValidation.lowercase ? 'text-green-600' : 'text-red-600'}>
                      {passwordValidation.lowercase ? '✓' : '•'} At least one lowercase letter (a-z)
                    </li>
                    <li className={passwordValidation.uppercase ? 'text-green-600' : 'text-red-600'}>
                      {passwordValidation.uppercase ? '✓' : '•'} At least one uppercase letter (A-Z)
                    </li>
                    <li className={passwordValidation.number ? 'text-green-600' : 'text-red-600'}>
                      {passwordValidation.number ? '✓' : '•'} At least one number (0-9)
                    </li>
                    <li className={passwordValidation.specialChar ? 'text-green-600' : 'text-red-600'}>
                      {passwordValidation.specialChar ? '✓' : '•'} At least one special character: !@#$%^&*_+=-()&lt;&gt;
                    </li>
                  </ul>
                  {Object.values(passwordValidation).every(Boolean) && (
                    <p className="mt-2 text-xs text-green-600 font-medium">✓ Password meets all requirements</p>
                  )}
                </div>
              )}
              
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Sign Up Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emov-purple focus:ring-opacity-50 flex items-center justify-center text-white"
              style={{ 
                background: 'var(--emov-gradient)',
                border: 'none'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            <p className="text-xs text-text-secondary text-center">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-emov-purple hover:text-emov-purple-dark transition-colors"
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