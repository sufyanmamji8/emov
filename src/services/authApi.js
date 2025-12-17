import axios from 'axios';

// Import toast for notifications
const showToast = (message, type = 'error') => {
  // Create toast element if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? '#ef4444' : '#22c55e'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    max-width: 300px;
    font-size: 14px;
    font-weight: 500;
  `;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
};

const API_BASE_URL = 'https://api.emov.com.pk';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Single consolidated request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single consolidated response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/login') || 
                           error.config?.url?.includes('/signup');
      
      if (!isAuthRequest) {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        
        // Show toast notification about session expiration
        showToast('Your session has expired. Please login again to continue.', 'error');
        
        // Delay redirect to allow user to see the toast
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

const authApi = {
  login: async (email, password) => {
    try {
      const response = await api.post('/v2/login', {
        email: email.trim(),
        password: password.trim()
      });
      
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        sessionStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch(status) {
          case 401:
            errorMessage = data?.message || 'Invalid email or password.';
            break;
          case 400:
            errorMessage = data?.message || 'Invalid request.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data?.message || data?.error || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      const loginError = new Error(errorMessage);
      loginError.status = error.response?.status;
      throw loginError;
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post('/v2/signup', {
        username: userData.fullName,
        email: userData.email,
        password: userData.password,
        mobileNo: userData.mobileNumber
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Signup failed' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/v2/forget-password', { 
        email: email.trim() 
      });
      
      if (response.data?.message === 'OTP sent to your email') {
        return { success: true, message: response.data.message };
      }
      
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to process forgot password request.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post('/v2/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'OTP verification failed' };
    }
  },

  resendOtp: async (email) => {
    try {
      const response = await api.post('/v2/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Failed to resend OTP' };
    }
  },

  resetPassword: async (email, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/v2/reset-password', {
        email,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  changePassword: async ({ currentPassword, newPassword, confirmPassword, email }) => {
    try {
      const response = await api.post('/v2/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
        email: email.trim()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  deleteAccount: async ({ password }) => {
    try {
      const response = await api.delete('/v2/delete-account', { data: { password } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  },

  uploadImage: async (formData) => {
    try {
      const response = await api.post('/v2/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload image' };
    }
  },

  updateProfilePic: async ({ userId, imageUrl }) => {
    try {
      const response = await api.post('/v2/updateProfilePic', { userId, imageUrl });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile picture' };
    }
  },

  updateProfileDetails: async (profileData) => {
    try {
      const response = await api.post('/v2/updateProfileDetails', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile details' };
    }
  }
};

export { authApi };
export default authApi;