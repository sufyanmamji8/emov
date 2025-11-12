import React, { useState, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../services/AuthApi';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Sending forgot password request for:', formData.email);
      const response = await authApi.forgotPassword(formData.email);
      console.log('Forgot password response:', response);
      
      if (response.message) {
        setSuccess(response.message);
        // Navigate to OTP verification page after a short delay
        setTimeout(() => {
          navigate('/enter-otp', { 
            state: { 
              email: formData.email,
              from: 'forgot-password' // Identify the flow
            } 
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Left side - Brand Section with Gradient */}
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
          <p className="text-2xl font-light mb-6 animate-slide-up text-text-secondary">Don't worry, we'll help you recover</p>
          <div className="w-24 h-1 bg-emov-purple mx-auto animate-expand"></div>
        </div>
      </div>

      {/* Right side - Forgot Password Form */}
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

        {/* Emov Logo at the very top */}
        <div className="w-36 mb-5">
          <img 
            src="/emovfont.png" 
            alt="Emov" 
            className="w-full h-auto"
          />
        </div>
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Forgot Password</h1>
          <p className="text-text-secondary mb-8">Enter your email address and we'll send you a verification code to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Error Message */}
          {error && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-slide-up">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="w-full p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-slide-up">
              <p className="text-green-600 dark:text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-gray-200 mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-emov-purple bg-bg-secondary text-text-primary"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6 animate-fade-in"></div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 mt-6 text-white text-lg font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              background: 'var(--emov-gradient)',
              border: 'none',
              backgroundSize: '200% auto',
              minHeight: '48px'
            }}
            disabled={loading}
            onMouseOut={(e) => {
              e.target.style.backgroundPosition = 'left center';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send OTP'
            )}
          </button>

          {/* Remember Password Link */}
          <p className="mt-4 text-center text-sm text-text-secondary dark:text-gray-300">
            I remember my password{' '}
            <Link 
              to="/login" 
              className="font-semibold hover:underline transition-colors duration-300 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'var(--emov-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.3s ease'
              }}
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;