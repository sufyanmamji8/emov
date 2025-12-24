import { toast as toastify, ToastContainer as ToastifyContainer } from 'react-toastify';
import { useEffect } from 'react';

// Inject global styles for toast - completely self-contained without styled-components
const injectToastStyles = () => {
  if (document.getElementById('toast-global-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'toast-global-styles';
  style.textContent = `
    /* Toast Container */
    .Toastify__toast-container {
      width: 100%;
      max-width: 400px;
      top: 1.5rem;
      right: 1.5rem;
      left: auto;
      transform: none;
      padding: 0;
      z-index: 9999;
    }

    /* Toast Base */
    .Toastify__toast {
      border-radius: 50px !important;
      min-height: 48px !important;
      padding: 0 !important;
      margin-bottom: 1rem !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      overflow: hidden !important;
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .Toastify__toast:hover {
      transform: translateY(-2px) scale(1.02) !important;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
    }

    /* Body - Perfectly Centered Text */
    .Toastify__toast-body {
      margin: 0 !important;
      padding: 16px 24px !important;
      font-weight: 600 !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      font-size: 15px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 48px !important;
      line-height: 1.5 !important;
      color: white !important;
      text-align: center !important;
      width: 100% !important;
      position: relative !important;
      z-index: 2 !important;
    }

    /* Progress Bar - Hidden but functional */
    .Toastify__progress-bar {
      height: 0px !important;
      border-radius: 0 0 12px 12px !important;
      background: transparent !important;
      opacity: 0 !important;
    }

    /* Close Button - Hidden */
    .Toastify__close-button {
      display: none !important;
    }

    /* Toast Types */
    .Toastify__toast--success {
      background: linear-gradient(to right, #00C9FF, #92FE9D) !important;
      border: 1px solid #00C9FF !important;
      color: #ffffff !important;
    }

    .Toastify__toast--success .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .Toastify__toast--error {
      background: linear-gradient(to right, #00C9FF, #92FE9D) !important;
      border: 1px solid #00C9FF !important;
      color: #ffffff !important;
    }

    .Toastify__toast--error .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .Toastify__toast--warning {
      background: linear-gradient(to right, #00C9FF, #92FE9D) !important;
      border: 1px solid #00C9FF !important;
      color: #ffffff !important;
    }

    .Toastify__toast--warning .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .Toastify__toast--info {
      background: linear-gradient(to right, #00C9FF, #92FE9D) !important;
      border: 1px solid #00C9FF !important;
      color: #ffffff !important;
    }

    .Toastify__toast--info .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    /* Animations */
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .Toastify__toast--default {
      animation: slideInRight 0.3s ease-out !important;
    }

    .Toastify__toast--close {
      animation: slideOutRight 0.3s ease-in !important;
    }

    /* Mobile responsiveness */
    @media (max-width: 480px) {
      .Toastify__toast-container {
        max-width: 90%;
        right: 1rem;
        left: 1rem;
      }
      
      .Toastify__toast {
        min-height: 44px !important;
        border-radius: 50px !important;
      }
      
      .Toastify__toast-body {
        padding: 10px 16px !important;
        font-size: 13px !important;
        min-height: 44px !important;
      }
      
    }

    /* Dark mode adjustments */
    @media (prefers-color-scheme: dark) {
      .Toastify__toast {
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
      }
    }
  `;
  document.head.appendChild(style);
};

// Enhanced toast configuration with proper cleanup
const toastConfig = {
  position: "top-right",
  autoClose: 3000, // Increased to 3 seconds for better visibility
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  pauseOnFocusLoss: false,
  closeButton: false, // Disabled close button
  newestOnTop: true,
  rtl: false,
  theme: 'light',
};

// Custom toast methods with enhanced styling and proper cleanup
export const toast = {
  success: (message, options = {}) => {
    // Clear any existing toasts to prevent stacking issues
    toastify.dismiss();
    
    return toastify.success(message, {
      ...toastConfig,
      ...options,
      autoClose: options.autoClose || 3000,
      icon: false, // Disable default icon as we use custom styling
      style: {
        background: 'linear-gradient(135deg, #0DFF9A 0%, #00E69A 100%)',
        color: '#ffffff',
        border: '1px solid #0DFF9A',
        borderRadius: '50px',
        boxShadow: '0 8px 24px rgba(13, 255, 154, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '48px',
        padding: '16px 24px',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...options.style,
      },
    });
  },

  error: (message, options = {}) => {
    toastify.dismiss();
    
    return toastify.error(message, {
      ...toastConfig,
      ...options,
      autoClose: options.autoClose || 4000, // Errors stay longer
      icon: false,
      style: {
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
        color: '#ffffff',
        border: '1px solid #FF6B6B',
        borderRadius: '50px',
        boxShadow: '0 8px 24px rgba(255, 107, 107, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '48px',
        padding: '16px 24px',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...options.style,
      },
    });
  },

  warning: (message, options = {}) => {
    toastify.dismiss();
    
    return toastify.warning(message, {
      ...toastConfig,
      ...options,
      autoClose: options.autoClose || 3500,
      icon: false,
      style: {
        background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
        color: '#ffffff',
        border: '1px solid #FFA726',
        borderRadius: '50px',
        boxShadow: '0 8px 24px rgba(255, 167, 38, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '48px',
        padding: '16px 24px',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...options.style,
      },
    });
  },

  info: (message, options = {}) => {
    toastify.dismiss();
    
    return toastify.info(message, {
      ...toastConfig,
      ...options,
      autoClose: options.autoClose || 3000,
      icon: false,
      style: {
        background: 'linear-gradient(135deg, #7B3DFF 0%, #A67AF5 100%)',
        color: '#ffffff',
        border: '1px solid #7B3DFF',
        borderRadius: '50px',
        boxShadow: '0 8px 24px rgba(123, 61, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '48px',
        padding: '16px 24px',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...options.style,
      },
    });
  },

  // Default toast method
  default: (message, options = {}) => {
    toastify.dismiss();
    
    return toastify(message, {
      ...toastConfig,
      ...options,
      icon: false,
      style: {
        background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
        color: '#ffffff',
        border: '1px solid #6B7280',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(107, 114, 128, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '64px',
        padding: '0',
        margin: '0 0 1rem 0',
        ...options.style,
      },
    });
  },

  // Manual dismiss method for cleanup
  dismiss: () => {
    toastify.dismiss();
  }
};

// Enhanced Toast Container component with global styles injection
export const ToastContainer = () => {
  useEffect(() => {
    injectToastStyles();
  }, []);

  return (
    <ToastifyContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      theme="light"
      closeButton={false}
      style={{ zIndex: 9999 }}
    />
  );
};

// Export the original toastify for advanced usage if needed
export { toastify };

export default toast;
