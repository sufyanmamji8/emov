import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../services/authApi';
import toast from '../utils/toast.jsx';

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
        
        // Show success toast using API message
        toast.success(response.message || 'Login successful');
        
        // Navigate after a short delay to allow toast to show
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/dashboard';
          console.log('Navigating to:', from);
          navigate(from, { replace: true });
        }, 1000);
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
      
      // Show error in toast instead of container
      toast.error(errorMessage);
      
      // Clear the form on invalid credentials
      if (error.response?.status === 401) {
        setFormData(prev => ({ ...prev, password: '' }));
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
        
        {/* Floating Bubbles Animation */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Bubble 1 - Large, slow float */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-float-slow blur-[2px]"></div>
          
          {/* Bubble 2 - Medium, medium speed */}
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400/15 to-blue-400/15 animate-float-medium blur-[1px]"></div>
          
          {/* Bubble 3 - Small, fast float */}
          <div className="absolute bottom-1/3 left-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 animate-float-fast blur-[1px]"></div>
          
          {/* Bubble 4 - Medium, reverse direction */}
          <div className="absolute top-2/3 left-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-blue-300/15 to-cyan-300/15 animate-float-reverse blur-[2px]"></div>
          
          {/* Bubble 5 - Small, diagonal */}
          <div className="absolute top-1/2 right-1/3 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-400/10 to-blue-400/10 animate-float-diagonal blur-[1px]"></div>
          
          {/* Bubble 6 - Tiny, quick */}
          <div className="absolute bottom-1/4 right-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-pink-400/10 to-rose-400/10 animate-float-quick"></div>
          
          {/* Bubble 7 - Large elliptical */}
          <div className="absolute top-1/4 right-1/3 w-28 h-24 rounded-full bg-gradient-to-r from-sky-400/10 to-blue-400/10 animate-float-elliptical blur-[2px]"></div>
          
          {/* Bubble 8 - Medium, delayed */}
          <div className="absolute bottom-1/3 left-1/4 w-18 h-18 rounded-full bg-gradient-to-r from-violet-400/10 to-purple-400/10 animate-float-delayed blur-[1px]"></div>
          
          {/* Subtle particle effect bubbles */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-blue-300/30 animate-particles"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Centered content with enhanced container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10">
          <div className="relative w-36 h-36">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-xl animate-pulse-slow"></div>
            
            {/* Logo container with subtle animation */}
            <div className="relative w-full h-full animate-soft-float">
              <img 
                src="/emovlogo.png" 
                alt="Emov Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            
            {/* Ring animation around logo */}
            <div className="absolute -inset-4 border-2 border-blue-300/20 rounded-full animate-ring-expand"></div>
            <div className="absolute -inset-6 border border-purple-300/10 rounded-full animate-ring-expand-delayed"></div>
          </div>
          
          <div className="relative w-32">
            <img 
              src="/emovfont.png" 
              alt="Emov" 
              className="w-full h-auto drop-shadow-sm"
            />
            {/* Subtle text glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-transparent blur-sm -z-10"></div>
          </div>
          
          <h2 className="text-gray-600 text-sm font-medium relative">
            Buy and Sell Vehicles
            {/* Animated underline */}
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-shimmer"></span>
          </h2>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center relative overflow-hidden">
        {/* Top Section with both logos */}
        <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: 'url(/authpattern.png)' }}>
          {/* Small emovfont.png at the top */}
          <div className="absolute top-12 sm:top-16">
            <img 
              src="/emovlogowhite.png" 
              alt="Emov" 
              className="h-6 sm:h-8 object-contain"
            />
          </div>
          {/* Main authemov.png in the center */}
          <div className="absolute -mt-6 sm:-mt-8 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <img 
              src="/authemov.png" 
              alt="Emov" 
              className="h-20 sm:h-24 object-contain"
            />
          </div>
        </div>
        
        {/* Login Card */}
        <div className="w-full max-w-md md:max-w-xl bg-white rounded-3xl -mt-40 sm:-mt-56 p-6 md:p-8 z-10 shadow-lg border border-gray-100 shadow-gray-400/30 mx-4 md:mx-auto">
          {/* Welcome Text */}
          <div className="text-center mb-6 md:mb-8 mt-4 md:mt-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Welcome</h1>
            <p className="text-sm md:text-base text-gray-600">Drive your business forward Sign In</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="space-y-4 md:space-y-5" 
            noValidate
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
                e.stopPropagation();
              }
            }}
          >
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 md:px-4 py-2.5 md:py-3 text-sm text-gray-900 border ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:outline-none bg-white transition-colors duration-200 hover:border-gray-400`}
                placeholder="Enter your email"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 break-words">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Password</label>
              <div className="relative">
                <input 
                  type={passwordVisible ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 text-sm text-gray-900 border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:outline-none bg-white transition-colors duration-200 hover:border-gray-400`}
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
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 break-words">{fieldErrors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-xs md:text-sm font-medium text-emov-purple hover:text-emov-purple-dark transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 md:py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emov-purple focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-white"
              style={{ 
                background: 'var(--emov-green)',
                border: 'none'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm md:text-base">Signing in...</span>
                </div>
              ) : (
                <span className="text-sm md:text-base">Sign in</span>
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center text-xs md:text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-medium text-emov-purple hover:text-emov-purple-dark transition-colors"
                style={{
                  backgroundImage: 'var(--emov-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Sign up
              </Link>
            </div>

            {/* Social Login Button */}
            <div className="flex justify-center mt-4">
              <img 
                src="/continue.png" 
                alt="Continue with social media" 
                className="cursor-pointer w-40 md:w-48 h-auto"
                onClick={() => console.log('Continue with social')}
              />
            </div>
          </form>
        </div>

        {/* Add some padding at the bottom for mobile */}
        <div className="h-8 sm:h-12"></div>
      </div>
    </div>
  );
};

export default Login;