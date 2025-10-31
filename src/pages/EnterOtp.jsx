import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../services/AuthApi';

const EnterOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

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
        console.log('Auto-submitting OTP:', otpValue);
        // Submit the OTP
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
      console.log('Verifying OTP for email:', userEmail);
      
      // Call verify OTP API
      const response = await authApi.verifyOtp(userEmail, otpValue);
      console.log('OTP verification response:', response);
      
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
      console.log('Resending OTP to:', userEmail);
      const response = await authApi.forgotPassword(userEmail);
      console.log('Resend OTP response:', response);
      
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
      console.log('Resending OTP to:', userEmail);
      // Add resend OTP logic here
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden no-scrollbar">
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
        
        <div className="max-w-md text-gray-800 text-center relative z-10">
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 md:p-16 lg:p-20">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          {/* OTP Image */}
          <div className="w-24 h-24 mb-6 flex justify-center items-center">
            <img 
              src="/otp.png" 
              alt="OTP Verification" 
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
            <p className="text-gray-600">We've sent a 6-digit code to</p>
            <p className="font-medium text-emov-purple">{userEmail}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Fields */}
            <div className="space-y-2">
              <div className="flex justify-between space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-14 h-16 text-3xl text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 ${
                      error 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-emov-purple focus:ring-emov-purple'
                    }`}
                    disabled={loading}
                    aria-label={`Digit ${index + 1} of 6`}
                  />
                ))}
              </div>
              
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 text-white text-lg font-medium rounded-lg transition-all duration-200 ${
                loading || otp.some(digit => !digit) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-emov-purple hover:bg-opacity-90 transform hover:scale-[1.02] active:scale-100'
              }`}
              disabled={loading || otp.some(digit => !digit)}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>

            {/* Resend Code */}
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-emov-purple font-medium hover:underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timer > 0 || loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emov-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  `Resend OTP ${timer > 0 ? `(${timer}s)` : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnterOtp;