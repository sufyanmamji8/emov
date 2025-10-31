import React, { useState, useEffect } from 'react';
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
    <div className="h-screen bg-white flex overflow-hidden no-scrollbar">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 z-50 rounded shadow-lg max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {/* Left side - Brand Section with Your Gradient */}
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
        
        <div className="max-w-md text-gray-800 text-center relative z-10 flex flex-col items-center">
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
          <p className="text-2xl font-light mb-6 animate-slide-up text-gray-700">Set a new password to continue</p>
          <div className="w-24 h-1 bg-emov-purple mx-auto animate-expand"></div>
        </div>
      </div>

      {/* Right side - Change Password Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center p-6 bg-white overflow-y-auto no-scrollbar" style={{ maxHeight: '100vh' }}>
        {/* Emov Logo at the very top */}
        <div className="w-full flex justify-center mb-5">
          <div className="w-36">
            <img 
              src="/emovfont.png" 
              alt="Emov" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        <div className="w-full max-w-md animate-fade-in flex flex-col items-center">
          <div className="w-24 h-24 -mt-4">
            <img 
              src="/changepass.png" 
              alt="Change Password" 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-medium text-gray-800 mb-1.5">Enter Password</h2>
            <p className="text-sm text-gray-500">
              Enter and confirm your new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* New Password Field */}
            <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
              <label className="block text-base font-normal text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:ring-opacity-50 focus:outline-none bg-white transition-all duration-300 hover:border-gray-300"
                  style={{ '--tw-ring-color': 'var(--emov-purple)' }}
                  placeholder="Enter your new password"
                  required
                />
                {/* Eye Icon Button */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={toggleNewPasswordVisibility}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <label className="block text-base font-normal text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 text-base border rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:ring-opacity-50 focus:outline-none bg-white transition-all duration-300 ${
                    formData.confirmPassword && !passwordsMatch 
                      ? 'border-red-300 hover:border-red-400' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ '--tw-ring-color': 'var(--emov-purple)' }}
                  placeholder="Confirm your new password"
                  required
                />
                {/* Eye Icon Button */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Password Validation Rules */}
            <div className="animate-slide-up p-4 bg-gray-50 rounded-lg border border-gray-200" style={{animationDelay: '0.3s'}}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Weak password. Must contain:</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(passwordValidation).map(([key, rule]) => (
                  <li key={key} className="flex items-center">
                    <span className="mr-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={3} 
                          d="M5 13l4 4L19 7"
                          className={rule.isValid ? 'text-emerald-500' : 'text-emerald-300'}
                        />
                      </svg>
                    </span>
                    <span className={rule.isValid ? 'text-gray-700' : 'text-gray-500'}>
                      {rule.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-6 text-white font-medium rounded-md transition-all duration-300 flex items-center justify-center ${isFormValid() ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800' : 'bg-gray-400 cursor-not-allowed'}`}
              disabled={!isFormValid() || loading}
              style={{
                backgroundSize: '200% auto',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                if (isFormValid()) {
                  e.target.style.backgroundPosition = 'right center';
                  e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseOut={(e) => {
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