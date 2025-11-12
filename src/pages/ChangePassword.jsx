import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../services/AuthApi';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Get email and OTP from location state
  useEffect(() => {
    if (location.state?.email && location.state?.otp) {
      setFormData(prev => ({
        ...prev,
        email: location.state.email,
        otp: location.state.otp
      }));
    } else {
      // Redirect to forgot password if no email/OTP is provided
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  // Password validation rules
  const passwordRules = {
    length: { isValid: false, message: 'Must be between 8 and 20 characters' },
    lowercase: { isValid: false, message: 'Must contain a lowercase letter' },
    uppercase: { isValid: false, message: 'Must contain an uppercase letter' },
    number: { isValid: false, message: 'Must contain a number' },
    special: { isValid: false, message: 'Must contain one of the following special characters: ! @ # $ ^ & * _ + = ( ) < >' }
  };

  const [passwordValidation, setPasswordValidation] = useState(passwordRules);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const validatePassword = (password) => {
    const rules = {
      length: password.length >= 8 && password.length <= 20,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$^&*_+=()<>]/.test(password)
    };

    setPasswordValidation(prev => ({
      length: { ...prev.length, isValid: rules.length },
      lowercase: { ...prev.lowercase, isValid: rules.lowercase },
      uppercase: { ...prev.uppercase, isValid: rules.uppercase },
      number: { ...prev.number, isValid: rules.number },
      special: { ...prev.special, isValid: rules.special }
    }));

    return Object.values(rules).every(rule => rule);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data first
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);

    // Check password match after state update
    if (name === 'newPassword' || name === 'confirmPassword') {
      const match = (name === 'newPassword') 
        ? (value === formData.confirmPassword)
        : (value === formData.newPassword);
      setPasswordsMatch(match);
    }
    
    // Validate password strength if it's the new password field
    if (name === 'newPassword') {
      validatePassword(value);
    }
  };

  const toggleNewPasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Re-validate everything on submit
    const isPasswordValid = validatePassword(formData.newPassword);
    const doPasswordsMatch = formData.newPassword === formData.confirmPassword;
    
    // Update the password match state
    setPasswordsMatch(doPasswordsMatch);

    if (!isPasswordValid) {
      setError('Please fix password validation errors');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.resetPassword(
        formData.email,
        formData.newPassword,
        formData.confirmPassword,
        formData.otp
      );
      
      if (response.message && response.message.includes('success')) {
        // Show success message and redirect to login
        alert('Password reset successfully! Please login with your new password.');
        navigate('/login');
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const isPasswordValid = Object.values(passwordValidation).every(rule => rule.isValid);
    const doPasswordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '';
    return isPasswordValid && doPasswordsMatch && !loading;
  };

  // Show error message if any
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-primary">
      {/* Left side - Brand Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative overflow-hidden" 
        style={{ maxHeight: '100vh', background: 'var(--emov-gradient)' }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emov-purple rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-emov-green rounded-full animate-bounce"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-emov-purple rounded-full animate-ping"></div>
        </div>
        
        <div className="max-w-md text-text-primary text-center relative z-10">
          <img 
            src="/emovlogo.png" 
            alt="Emov Logo" 
            className="w-48 mx-auto mb-8"
          />
          <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
          <p className="text-lg opacity-90">Create a new password to secure your account.</p>
        </div>
      </div>

      {/* Right side - Change Password Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-bg-primary">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-bg-secondary transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <FaSun className="w-5 h-5 text-yellow-300" />
          ) : (
            <FaMoon className="w-5 h-5 text-text-secondary" />
          )}
        </button>
        
        <div className="w-full max-w-md">
          <img 
            src="/emovlogo.png" 
            alt="Emov Logo" 
            className="w-40 h-40 mb-6 animate-fade-in"
          />
          {error && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Create New Password</h1>
            <p className="text-text-secondary mb-8">
              Your new password must be different from previous used passwords.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* New Password Field */}
            <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
              <label className="block text-base font-normal text-text-primary dark:text-gray-200 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${theme === 'dark' ? 'border-gray-600' : 'border-border-primary'} rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-emov-purple focus:border-transparent bg-bg-primary dark:bg-gray-800 text-text-primary dark:text-white`}
                  placeholder="New Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <label className="block text-base font-normal text-text-primary dark:text-gray-200 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    passwordValidation.length.isValid ? 'border-green-500' : 'border-red-500'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-secondary text-text-primary`}
                  placeholder="Confirm New Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Password Validation Rules */}
            <div className="animate-slide-up p-4 bg-bg-secondary dark:bg-gray-800 rounded-lg border border-border-primary dark:border-gray-700" style={{animationDelay: '0.3s'}}>
              <h3 className="text-sm font-medium text-text-primary dark:text-gray-200 mb-3">Password must contain:</h3>
              <ul className="space-y-2">
                {Object.entries(passwordValidation).map(([key, rule]) => (
                  <li key={key} className="flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${rule.isValid ? 'bg-emov-green' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      {rule.isValid && <FaCheck className="text-white text-xs" />}
                    </div>
                    <span className={`text-sm ${rule.isValid ? 'text-emov-green' : 'text-text-secondary dark:text-gray-400'}`}>
                      {rule.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={!isFormValid()}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emov-purple transition-colors ${
                !isFormValid() ? 'bg-emov-purple/70 cursor-not-allowed' : 'bg-emov-purple hover:bg-emov-purple/90'
              }`}
              onMouseEnter={(e) => {
                if (isFormValid()) {
                  e.target.style.backgroundPosition = 'right center';
                  e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid()) {
                  e.target.style.backgroundPosition = 'left center';
                  e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;