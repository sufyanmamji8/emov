import { toast as toastify, ToastContainer as ToastifyContainer } from 'react-toastify';
import { createGlobalStyle } from 'styled-components';

// Premium Global Toast Styles
const ToastGlobalStyles = createGlobalStyle`
  /* Container */
  .Toastify__toast-container {
    width: 400px;
    max-width: 95vw;
    padding: 0;
    top: 24px;
    right: 24px;
    z-index: 9999;
  }

  /* Base Toast */
  .Toastify__toast {
    border-radius: 9999px !important; /* True pill */
    min-height: 64px !important;
    padding: 0 12px !important;
    margin-bottom: 16px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: none !important;
    overflow: hidden !important;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) !important;
    position: relative;
  }

  /* Inner shine overlay */
  .Toastify__toast::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%);
    pointer-events: none;
  }

  .Toastify__toast:hover {
    transform: translateY(-6px) scale(1.03) !important;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.22) !important;
  }

  /* Body - Centered Text */
  .Toastify__toast-body {
    margin: 0 !important;
    padding: 0 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 64px !important;
    width: 100% !important;
    text-align: center !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    color: white !important;
    line-height: 1.5 !important;
    letter-spacing: 0.3px;
  }

  /* Progress Bar */
  .Toastify__progress-bar {
    height: 4px !important;
    border-radius: 0 0 9999px 9999px !important;
    background: rgba(255, 255, 255, 0.4) !important;
  }

  /* Close Button */
  .Toastify__close-button {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.8) !important;
    opacity: 0.8 !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
  }

  .Toastify__close-button:hover {
    opacity: 1 !important;
    background: rgba(255, 255, 255, 0.2) !important;
  }

  .Toastify__close-button > svg {
    width: 20px !important;
    height: 20px !important;
  }

  /* Toast Types - Beautiful Gradients */
  .Toastify__toast--success {
    background: linear-gradient(135deg, #10B981 0%, #34D399 100%) !important; /* Emerald */
  }

  .Toastify__toast--error {
    background: linear-gradient(135deg, #EF4444 0%, #F87171 100%) !important; /* Red */
  }

  .Toastify__toast--warning {
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%) !important; /* Amber */
  }

  .Toastify__toast--info {
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%) !important; /* Purple */
  }

  .Toastify__toast--default {
    background: linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%) !important; /* Cyan */
  }

  /* Animations */
  @keyframes slideInRight {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
  }

  .Toastify__toast {
    animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards !important;
  }

  .Toastify__toast--closing {
    animation: slideOutRight 0.3s ease-in forwards !important;
  }

  /* Mobile */
  @media (max-width: 480px) {
    .Toastify__toast-container {
      width: calc(100% - 32px);
      left: 16px;
      right: 16px;
      top: 16px;
    }

    .Toastify__toast {
      min-height: 58px !important;
    }

    .Toastify__toast-body {
      height: 58px !important;
      font-size: 15px !important;
      padding: 0 28px !important;
    }

    .Toastify__close-button {
      right: 10px;
      width: 32px !important;
      height: 32px !important;
    }
  }
`;

// Reliable config
const toastConfig = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  pauseOnFocusLoss: false,
  closeButton: true,
  newestOnTop: true,
  rtl: false,
  theme: "light",
};

// Enhanced custom toast - NO toastify.dismiss() to avoid autoClose issues
export const toast = {
  success: (message, options = {}) => {
    return toastify.success(message, {
      ...toastConfig,
      ...options,
      icon: false,
    });
  },

  error: (message, options = {}) => {
    return toastify.error(message, {
      ...toastConfig,
      ...options,
      autoClose: options.autoClose || 5000,
      icon: false,
    });
  },

  warning: (message, options = {}) => {
    return toastify.warning(message, {
      ...toastConfig,
      ...options,
      autoClose: options.autoClose || 4000,
      icon: false,
    });
  },

  info: (message, options = {}) => {
    return toastify.info(message, {
      ...toastConfig,
      ...options,
      icon: false,
    });
  },

  default: (message, options = {}) => {
    return toastify(message, {
      ...toastConfig,
      ...options,
      icon: false,
    });
  },

  dismissAll: () => toastify.dismiss(),
};

// Toast Container with injected styles
export const ToastContainer = () => (
  <>
    <ToastGlobalStyles />
    <ToastifyContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      closeButton={true}
      style={{ zIndex: 9999 }}
    />
  </>
);

export { toastify };
export default toast;