import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import authApi from '../services/authApi';

const EnterOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Get email from location state or URL params
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    // First try to get email from location state
    const emailFromState = location.state?.email;
    
    // If not in state, try to get from URL params
    const searchParams = new URLSearchParams(location.search);
    const emailFromParams = searchParams.get('email');
    
    // Use email from state, then params, or empty string
    const email = emailFromState || emailFromParams || '';
    
    if (email) {
      setUserEmail(email);
    } else {
      // Only redirect if we can't get email from any source
      navigate('/forgot-password', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // Timer countdown
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input if there's a value and not the last input
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
      
      // Auto-submit if all 6 digits are entered
      const isLastInput = index === 5;
      const allFilled = newOtp.every(digit => digit.length === 1);
      
      if (isLastInput && allFilled) {
        const otpValue = newOtp.join('');
        handleVerifyOtp(otpValue);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = [...otp];
      pasteData.split('').forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus the last filled input
      const lastFilledIndex = Math.min(pasteData.length - 1, 5);
      inputRefs.current[lastFilledIndex].focus();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    handleVerifyOtp(otpValue);
  };

  const handleVerifyOtp = async (otpValue) => {
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.verifyOtp(userEmail, otpValue);
      
      // Navigate to change password page with email and OTP
      navigate('/change-password', { 
        state: { 
          email: userEmail,
          otp: otpValue 
        },
        replace: true
      });
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
      
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return; // Prevent multiple clicks
    
    setError('');
    setLoading(true);
    
    try {
      const response = await authApi.forgotPassword(userEmail);
      
      if (response.message) {
        // Reset timer and clear OTP fields
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
    if (timer === 0) {
      setTimer(60);
      // Add resend OTP logic here
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
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

      {/* Right Section - OTP Form */}
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
          {/* Main otpemov.png in the center */}
          <div className="absolute -mt-8 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <img 
              src="/otp.png" 
              alt="Emov" 
              className="h-24 object-contain"
            />
          </div>
        </div>
        
        {/* OTP Card */}
        <div className="w-full max-w-xl bg-white rounded-3xl -mt-56 p-8 z-10 shadow-lg border border-gray-100 shadow-gray-400/30">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mt-2 text-gray-900 mb-1">Enter OTP</h1>
            <p className="text-gray-600">We've sent a 6-digit code to {userEmail || 'your email'}</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* OTP Input Fields */}
            <div className="space-y-2">
              <div className="flex justify-center space-x-2 mb-8" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-full h-12 text-xl text-center rounded-lg border ${
                      error ? 'border-red-500' : 'border-border-primary'
                    } focus:ring-2 focus:ring-emov-purple focus:border-transparent bg-bg-secondary text-text-primary`}
                    disabled={loading}
                  />
                ))}
              </div>
              
              {error && (
                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.some(digit => !digit)}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emov-purple transition-colors ${
                loading || otp.some(digit => !digit) ? 'bg-emov-purple/70 cursor-not-allowed' : 'bg-emov-purple hover:bg-emov-purple/90'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-text-secondary">
                Didn't receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={timer > 0}
                  className={`font-medium ${
                    timer > 0 ? 'text-text-tertiary cursor-not-allowed' : 'text-emov-purple hover:text-emov-purple/80 hover:underline'
                  }`}
                >
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnterOtp;