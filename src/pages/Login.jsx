import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../services/AuthApi';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from signup
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the location state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for the current field when user types
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    setError('');
    setSuccess('');
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
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
    setSuccess('');
    
    try {
      console.log('Attempting login with email:', formData.email);
      const response = await authApi.login(formData.email, formData.password);
      console.log('Login response:', response);
      
      // Extract the access token from the response
      const token = response.accessToken || response.token;
      
      if (token) {
        console.log('Login successful, token received:', token);
        console.log('Full API response:', response);
        
        // Store the token in localStorage for persistence
        localStorage.setItem('token', token);
        
        // The user data is in response.data
        if (response.data) {
          console.log('Storing user data:', response.data);
          // Store the entire data object as it contains all user information
          localStorage.setItem('user', JSON.stringify(response.data));
        }
        
        // Call the onLogin callback with the token
        if (typeof onLogin === 'function') {
          onLogin(token);
        }
        
        // Navigate to the dashboard or the page the user was trying to access
        const from = location.state?.from?.pathname || '/dashboard';
        console.log('Navigating to:', from);
        navigate(from, { replace: true });
      } else {
        console.error('No accessToken found in response:', response);
        setError('Authentication failed. No access token received.');
      }
    } catch (error) {
      console.error('Login error details:', error);
      
      // Use the error message from the API if available
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Login failed. Please try again.';
      
      setError(errorMessage);
      
      // Clear the form on invalid credentials
      if (error.response?.status === 401) {
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden no-scrollbar">
      {/* Left side - Brand Section with Your Gradient */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative overflow-hidden" 
        style={{ background: 'var(--emov-gradient)' }}
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
          <p className="text-2xl font-light mb-6 animate-slide-up text-gray-700">Buy & Sell Vehicles</p>
          <div className="w-24 h-1 bg-emov-purple mx-auto animate-expand"></div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md">
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
          <div className="w-32 h-32 -mt-4">
            <img 
              src="/loginemov.png" 
              alt="Emov Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-medium text-gray-800 mb-1.5">Welcome</h2>
            <p className="text-sm text-gray-500">Drive your business forward</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-slide-up">
              <p className="text-green-600 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-up">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="w-full space-y-4" 
            noValidate
            onKeyDown={(e) => {
              // Handle form submission on Enter key press
              if (e.key === 'Enter') {
                handleSubmit(e);
                e.stopPropagation();
              }
            }}
          >
            {/* Email Field */}
            <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
              <label className="block text-lg font-normal text-gray-700 mb-1.5">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-lg border ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:ring-opacity-50 focus:outline-none bg-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed`}
                style={{ '--tw-ring-color': fieldErrors.email ? '#ef4444' : 'var(--emov-purple)' }}
                placeholder="Enter your email"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field - COMPLETELY FIXED */}
            <div className="relative animate-slide-up" style={{animationDelay: '0.2s'}}>
              <label className="block text-lg font-normal text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={passwordVisible ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 text-lg border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:ring-opacity-50 focus:outline-none bg-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed`}
                  style={{ '--tw-ring-color': fieldErrors.password ? '#ef4444' : 'var(--emov-purple)' }}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {passwordVisible ? (
                    // Show eye-off icon when password is visible (click to hide)
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    // Show eye icon when password is hidden (click to show)
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Support - Forgot Password */}
            <div className="text-center animate-slide-up" style={{animationDelay: '0.3s'}}>
              <Link 
                to="/forgot-password" 
                className="text-base font-normal bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'var(--emov-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6 animate-fade-in"></div>

            {/* Sign In Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-white text-base font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-100 animate-slide-up disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'var(--emov-gradient)',
                animationDelay: '0.4s',
                border: 'none',
                backgroundSize: '200% auto',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundPosition = 'right center';
                  e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundPosition = 'left center';
                  e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center text-base text-gray-600 animate-slide-up" style={{animationDelay: '0.5s'}}>
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-semibold hover:underline transition-colors duration-300 bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'var(--emov-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                Sign up
              </Link>
            </div>

            {/* Social Login Section */}
            <div className="mt-6 w-full animate-fade-in flex justify-center">
              <img 
                src="/continue.png" 
                alt="Continue with social media" 
                className="cursor-pointer"
                onClick={() => console.log('Continue with social')}
              />
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;