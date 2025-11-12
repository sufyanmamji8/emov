import axios from 'axios';

const API_BASE_URL = 'https://api.emov.com.pk';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Request interceptor to add auth token to requests
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

// Response interceptor to handle 401 responses and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only handle 401 errors for non-login requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      const currentPath = window.location.pathname;
      const isAuthPage = ['/login', '/signup', '/forgot-password', '/enter-otp', '/reset-password'].includes(currentPath);
      
      // If we're not on an auth page and this is the first retry
      if (!isAuthPage) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
            const { token, user } = response.data;
            
            // Update the stored tokens
            localStorage.setItem('token', token);
            
            // Update the Authorization header
            originalRequest.headers.Authorization = `Bearer ${token}`;
            
            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, proceed to logout
        }
        
        // If we get here, either refresh token failed or wasn't available
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        
        // Only redirect if not already on an auth page
        if (!isAuthPage) {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
          window.location.href = '/login';
        }
      }
    } else if (error.code === 'ERR_NETWORK') {
      // Handle network errors separately - don't log out for these
      console.error('Network error:', error);
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

const apiService = {
  // Ad related APIs
  ads: {
    // Create a new ad
    create: async (formData) => {
      try {
        // Log form data for debugging
        console.log('Sending form data to API...');
        const formDataObj = {};
        
        // Create a new FormData instance to ensure proper file handling
        const formDataToSend = new FormData();
        
        // Process each form field
        for (let [key, value] of formData.entries()) {
          // Skip empty values
          if (value === undefined || value === null || value === '') continue;
          
          // Handle file uploads
          if (value instanceof File || (typeof value === 'object' && value.uri)) {
            formDataToSend.append(key, value);
            formDataObj[key] = value.name || 'file';
          } 
          // Handle JSON strings (like the Images array)
          else if (key === 'Images' && typeof value === 'string' && value.startsWith('[')) {
            formDataToSend.append(key, value);
            formDataObj[key] = value;
          }
          // Handle regular fields
          else {
            formDataToSend.append(key, value);
            formDataObj[key] = value;
          }
        }
        
        console.log('Processed FormData:', formDataObj);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await api.post('/v2/ads/create', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          timeout: 60000, // 60 seconds timeout
          maxContentLength: 50 * 1024 * 1024, // 50MB max content length
          withCredentials: true,
        });
        
        console.log('API Response:', response.data);
        
        if (response.status === 201) {
          return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || 'Ad created successfully!'
          };
        } else {
          throw new Error(response.data?.message || `Server responded with status ${response.status}`);
        }
      } catch (error) {
        console.error('API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            data: error.config?.data,
          },
        });
        
        let errorMessage = 'Failed to create ad';
        if (error.response) {
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        `Server error (${error.response.status})`;
        } else if (error.request) {
          errorMessage = 'No response from server';
        }
        
        const customError = new Error(errorMessage);
        customError.response = error.response;
        throw customError;
      }
    },
    
    // Get all ads (example)
    getAll: async () => {
      try {
        const response = await api.get('/v2/ads');
        return response.data;
      } catch (error) {
        console.error('Error fetching ads:', error);
        throw error;
      }
    },
    
    // Get ad by ID (example)
    getById: async (id) => {
      try {
        const response = await api.get(`/v2/ads/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching ad ${id}:`, error);
        throw error;
      }
    },
  },
  
  // Vehicle related APIs (from Dashboard)
  vehicles: {
    // Get vehicle filters
    getFilters: async () => {
      try {
        const response = await api.get('/v2/vehiclesfilter');
        return response.data;
      } catch (error) {
        console.error('Error fetching vehicle filters:', error);
        throw error;
      }
    },
    
    // Get featured vehicles (example)
    getFeatured: async () => {
      try {
        const response = await api.get('/v2/vehicles/featured');
        return response.data;
      } catch (error) {
        console.error('Error fetching featured vehicles:', error);
        throw error;
      }
    },
  },
  
  // User related APIs
  user: {
    // Get user profile
    getProfile: async () => {
      try {
        const response = await api.get('/api/user/profile');
        return response.data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },
    
    // Update user profile (example)
    updateProfile: async (userData) => {
      try {
        const response = await api.put('/api/user/profile', userData);
        return response.data;
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    },
  },
  
  // Auth related APIs (already in AuthApi.js, but included here for completeness)
  auth: {
    login: async (email, password) => {
      try {
        const response = await api.post('/v2/login', { email, password });
        return response.data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    
    logout: async () => {
      try {
        const response = await api.post('/v2/logout');
        return response.data;
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    
    refreshToken: async () => {
      try {
        const response = await api.post('/v2/refresh-token', {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Refresh token error:', error);
        throw error;
      }
    },
  },
};

export default apiService;
