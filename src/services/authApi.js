import axios from 'axios';

// Enable CORS for all requests
axios.defaults.withCredentials = true;

const API_BASE_URL = 'https://api.emov.com.pk';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Log all requests
api.interceptors.request.use(request => {
  const fullUrl = `${request.baseURL}${request.url}`;
  console.log('=== API REQUEST ===');
  console.log('URL:', fullUrl);
  console.log('Method:', request.method);
  console.log('Data:', request.data);
  console.log('Headers:', request.headers);
  console.log('===================');
  return request;
});

// Log all responses
api.interceptors.response.use(
  response => {
    console.log('=== API RESPONSE ===');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('===================');
    return response;
  },
  error => {
    console.error('=== API ERROR ===');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
      console.error('Request Data:', error.config?.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
      console.error('Request Data:', error.config?.data);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    console.error('=================');
    return Promise.reject(error);
  }
);

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only handle 401 for non-login requests to prevent infinite redirects
      const isLoginRequest = error.config?.url?.includes('/login');
      if (!isLoginRequest) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Don't redirect automatically - let the components handle it
        console.log('[authApi] 401 error handled, no automatic redirect');
      }
    }
    throw error;
  }
);

// Create the authApi object with all methods
const authApi = {
  // Login API
  login: async (email, password) => {
    try {
      const loginData = {
        email: email.trim(),
        password: password.trim()
      };
      
      console.log('Sending login request with:', { ...loginData, password: '***' });
      
      // Use the configured axios instance
      const response = await api.post('/v2/login', loginData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true
      });
      
      console.log('Login successful, response:', response.data);
      
      // Store the token in localStorage and sessionStorage
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        sessionStorage.setItem('token', response.data.token);
        console.log('Token stored successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      
      // Default error message
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      // Extract the error message from the response if available
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data || {};
        
        console.log('Error response data:', errorData);
        
        // Handle different status codes
        switch(status) {
          case 401:
            errorMessage = errorData.message || 'Invalid email or password. Please try again.';
            break;
          case 400:
            errorMessage = errorData.message || 'Invalid request. Please check your input.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = errorData.message || errorData.error || error.message || errorMessage;
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        console.error('Error setting up the request:', error.message);
        errorMessage = error.message || 'An error occurred. Please try again.';
      }
      
      // Create a new error with the extracted message
      const loginError = new Error(errorMessage);
      loginError.status = error.response?.status;
      
      console.error('Login error:', loginError);
      throw loginError;
    }
  },

  // Signup API - Updated with your payload structure
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

  // Forgot Password API
  forgotPassword: async (email) => {
    try {
      console.log('Sending forget password request for email:', email);
      const response = await api.post('/v2/forget-password', { 
        email: email.trim() 
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Forget password response:', response.data);
      
      // Handle the expected response format
      if (response.data && response.data.message === 'OTP sent to your email') {
        return { success: true, message: response.data.message };
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Forget password error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to process forgot password request. Please try again.';
      
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 404) {
          errorMessage = 'The requested resource was not found. Please check the endpoint URL.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Verify OTP API
  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post('/v2/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'OTP verification failed' };
    }
  },

  // Resend OTP API
  resendOtp: async (email) => {
    try {
      const response = await api.post('/v2/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Failed to resend OTP' };
    }
  },

  // Reset Password API
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

  // Change password API (authenticated user)
  changePassword: async ({ oldPassword, newPassword, confirmPassword, email }) => {
    try {
      const payload = {
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
        email: email.trim()
      };
      const response = await api.post('/v2/change-password', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Delete account API
  deleteAccount: async () => {
    try {
      const response = await api.delete('/v2/delete-account');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  },

  // Upload image file, returns transformed imageUrl
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

  // Update profile picture reference for the user
  updateProfilePic: async ({ userId, imageUrl }) => {
    try {
      const response = await api.post('/v2/updateProfilePic', { userId, imageUrl });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile picture' };
    }
  },

  // Update profile details API
  updateProfileDetails: async (profileData) => {
    try {
      const response = await api.post('/v2/updateProfileDetails', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile details' };
    }
  },

  // Change password API (authenticated user)
  changePassword: async ({ oldPassword, newPassword, confirmPassword, email }) => {
    try {
      const payload = {
        oldPassword,
        newPassword,
        confirmPassword,
      };
      if (email) {
        payload.email = email;
      }
      const response = await api.post('/v2/change-password', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  }
};

export { authApi };
export default authApi;