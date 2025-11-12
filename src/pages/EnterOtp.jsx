import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import authApi from '../services/AuthApi';

const EnterOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Get email from location state or redirect back
  const userEmail = location.state?.email;
  
  // Redirect back if no email is provided
  useEffect(() => {
    if (!userEmail) {
      navigate('/forgot-password');
    }
  }, [userEmail, navigate]);

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
        
        <div className="max-w-md text-white text-center relative z-10">
          <img 
            src="/emovlogo.png" 
            alt="Emov Logo" 
            className="w-48 mx-auto mb-8"
          />
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg opacity-90">Enter the OTP sent to your email to verify your account.</p>
        </div>
      </div>

      {/* Right side - OTP Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-bg-primary relative">
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

        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          {/* OTP Image */}
          <div className="w-24 h-24 mb-6 flex justify-center items-center">
            <img 
              src="/otp.png" 
              alt="OTP Verification" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">Enter Verification Code</h1>
          <p className="text-text-secondary mb-8 text-center">
            We've sent a 6-digit code to <span className="font-medium">{userEmail}</span>
          </p>
          
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