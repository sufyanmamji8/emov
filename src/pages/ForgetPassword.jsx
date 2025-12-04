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
      {/* Right Section - Forgot Password Form */}
     {/* Right Section - Forgot Password Form */}
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
          {/* Main forgetpass.png in the center */}
          <div className="absolute -mt-8 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <img 
              src="/forgetpass.png" 
              alt="Emov" 
              className="h-24 object-contain"
            />
          </div>
        </div>
        
        {/* Forgot Password Card */}
        <div className="w-full max-w-xl bg-white rounded-3xl -mt-56 p-8 z-10 shadow-lg border border-gray-100 shadow-gray-400/30">
    {/* Welcome Text */}
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold mt-2 text-gray-900 mb-1">Forgot Password</h1>
      <p className="text-gray-600">Enter your email to reset your password</p>
    </div>

    {/* Error Message */}
    {error && (
      <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm text-center">{error}</p>
      </div>
    )}

    {/* Success Message */}
    {success && (
      <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-600 text-sm text-center">{success}</p>
      </div>
    )}

    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Email Field */}
      <div>
        <label className="block text-sm font-normal text-gray-700 mb-1">Email</label>
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emov-purple focus:border-transparent focus:outline-none bg-gray-100"
          placeholder="Enter your email"
          required
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 px-4 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
        style={{ 
          background: 'var(--emov-green)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : 'Send OTP'}
      </button>
    </form>

    {/* Back to Login Link */}
    <div className="mt-4 text-center">
      <p className="text-sm text-gray-600">
        Remember your password?{' '}
        <Link 
          to="/login" 
          className="font-medium text-emov-purple hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  </div>
</div>
    </div>
  );
};

export default ForgotPassword;