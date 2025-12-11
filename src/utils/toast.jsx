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
      max-width: 420px;
      top: 1.5rem;
      right: 1.5rem;
      left: auto;
      transform: none;
      padding: 0;
      z-index: 9999;
    }

    /* Toast Base */
    .Toastify__toast {
      border-radius: 12px !important;
      min-height: 64px !important;
      padding: 0 !important;
      margin-bottom: 1rem !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }

    .Toastify__toast:hover {
      transform: translateY(-2px) scale(1.02) !important;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
    }

    .Toastify__toast-body {
      margin: 0 !important;
      padding: 16px 20px !important;
      font-weight: 500 !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      font-size: 15px !important;
      display: flex !important;
      align-items: center !important;
      min-height: 64px !important;
      line-height: 1.5 !important;
      color: inherit !important;
    }

    /* Progress Bar */
    .Toastify__progress-bar {
      height: 3px !important;
      border-radius: 0 0 12px 12px !important;
      background: rgba(255, 255, 255, 0.3) !important;
    }

    /* Close Button */
    .Toastify__close-button {
      align-self: center !important;
      margin-right: 16px !important;
      color: rgba(255, 255, 255, 0.8) !important;
      opacity: 0.8 !important;
      transition: all 0.2s ease !important;
      width: 32px !important;
      height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
    }

    .Toastify__close-button:hover {
      opacity: 1 !important;
      background: rgba(255, 255, 255, 0.15) !important;
      color: rgba(255, 255, 255, 1) !important;
    }

    /* Toast Types */
    .Toastify__toast--success {
      background: linear-gradient(135deg, #0DFF9A 0%, #00E69A 100%) !important;
      border: 1px solid #0DFF9A !important;
      color: #ffffff !important;
    }

    .Toastify__toast--success .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .Toastify__toast--error {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%) !important;
      border: 1px solid #FF6B6B !important;
      color: #ffffff !important;
    }

    .Toastify__toast--error .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .Toastify__toast--warning {
      background: linear-gradient(135deg, #FFA726 0%, #FF9800 100%) !important;
      border: 1px solid #FFA726 !important;
      color: #ffffff !important;
    }

    .Toastify__toast--warning .Toastify__progress-bar {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .Toastify__toast--info {
      background: linear-gradient(135deg, #7B3DFF 0%, #A67AF5 100%) !important;
      border: 1px solid #7B3DFF !important;
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
        min-height: 60px !important;
        border-radius: 10px !important;
      }
      
      .Toastify__toast-body {
        padding: 14px 16px !important;
        font-size: 14px !important;
      }
      
      .Toastify__close-button {
        margin-right: 12px !important;
        width: 28px !important;
        height: 28px !important;
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
  closeButton: true,
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
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(13, 255, 154, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '64px',
        padding: '0',
        margin: '0 0 1rem 0',
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
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(255, 107, 107, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '64px',
        padding: '0',
        margin: '0 0 1rem 0',
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
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(255, 167, 38, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '64px',
        padding: '0',
        margin: '0 0 1rem 0',
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
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(123, 61, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: '64px',
        padding: '0',
        margin: '0 0 1rem 0',
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
      closeButton={true}
      style={{ zIndex: 9999 }}
    />
  );
};

// Export the original toastify for advanced usage if needed
export { toastify };

export default toast;
