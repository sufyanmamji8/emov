import axios from 'axios';

// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.MODE === 'development' ? '/v2' : 'https://api.emov.com.pk/v2';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  maxBodyLength: Infinity,
  maxContentLength: Infinity
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Add X-PLATFORM header for unauthorized requests to specific endpoints
      const isVehicleFilterRequest = config.url?.includes('vehiclesfilter');
      const isVehicleModelsRequest = config.url?.includes('/vehicles/models');
      const isFeaturedVehiclesRequest = config.url?.includes('/vehicles/featured');
      const isAdsRequest = config.url?.includes('/ads') && !config.url?.includes('/my-ads');
      
      if (isVehicleFilterRequest || isVehicleModelsRequest || isFeaturedVehiclesRequest || isAdsRequest) {
        config.headers['X-PLATFORM'] = 'WEB';
      }
    }

    // Handle FormData - let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      const isLogoutAction = originalRequest?.url?.includes('/auth/logout');
      
      if (isLogoutAction) {
        return Promise.reject(error);
      }
      
      // Check if this is a refresh token request to prevent infinite loops
      if (originalRequest.url.includes('/auth/refresh')) {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        return Promise.reject(error);
      }

      // Check if this is an unauthorized request to vehicle endpoints or ads endpoints
      const isVehicleFilterRequest = originalRequest?.url?.includes('vehiclesfilter');
      const isVehicleModelsRequest = originalRequest?.url?.includes('/vehicles/models');
      const isFeaturedVehiclesRequest = originalRequest?.url?.includes('/vehicles/featured');
      const isAdsRequest = originalRequest?.url?.includes('/ads') && !originalRequest?.url?.includes('/my-ads');
      const hasPlatformHeader = originalRequest?.headers?.['X-PLATFORM'] === 'WEB';
      
      if ((isVehicleFilterRequest || isVehicleModelsRequest || isFeaturedVehiclesRequest || isAdsRequest) && hasPlatformHeader) {
        return Promise.reject(error);
      }

      // If this is a retry after a failed refresh, reject
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // Set the retry flag
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await api.post('/auth/refresh');
        const { token, accessToken } = response.data;
        
        // Store the new tokens
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', accessToken);
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        return Promise.reject(refreshError);
      }
    }
    
    // Handle CORS errors that might be 401s
    if (error.code === 'ERR_NETWORK' && error.message.includes('CORS')) {
      const isVehicleFilterRequest = originalRequest?.url?.includes('vehiclesfilter');
      const isVehicleModelsRequest = originalRequest?.url?.includes('/vehicles/models');
      const isFeaturedVehiclesRequest = originalRequest?.url?.includes('/vehicles/featured');
      const isAdsRequest = originalRequest?.url?.includes('/ads') && !originalRequest?.url?.includes('/my-ads');
      const hasPlatformHeader = originalRequest?.headers?.['X-PLATFORM'] === 'WEB';
      
      if ((isVehicleFilterRequest || isVehicleModelsRequest || isFeaturedVehiclesRequest || isAdsRequest) && hasPlatformHeader) {
        return Promise.reject(error);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
      }
      return Promise.reject(error);
    }

    // Use server error message if available
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    
    return Promise.reject(error);
  }
);

// Main API service object
const apiService = {
  // Ad related APIs
  ads: {
    // Create a new ad
    create: async (formData) => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const requestData = { ...formData };
        
        // ✅ FIX: Ensure VehiclePower is a string with unit
        if (requestData.VehiclePower && typeof requestData.VehiclePower === 'number') {
          requestData.VehiclePower = `${requestData.VehiclePower} HP`;
        }
        
        // Ensure all numeric fields are properly converted to numbers
        const numericFields = ['VehicleModelID', 'VehiclePrice', 'VehicleTypeID', 'VehicleBrandID', 'VehicleBodyTypeID'];
        
        numericFields.forEach(field => {
          if (requestData[field] !== undefined && requestData[field] !== '') {
            requestData[field] = Number(requestData[field]);
          }
        });
        
        // UserID should be a string
        if (requestData.UserID) {
          requestData.UserID = String(requestData.UserID);
        }
        
        // RegistrationYear should be a string
        if (requestData.RegistrationYear) {
          requestData.RegistrationYear = String(requestData.RegistrationYear);
        }
        
        const response = await axios({
          method: 'post',
          url: `${API_BASE_URL}/ads/create`,
          data: requestData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          withCredentials: true,
          timeout: 30000
        });
        
        if (response.status >= 200 && response.status < 300) {
          return {
            success: true,
            data: response.data,
            message: response.data?.message || 'Ad created successfully!',
            status: response.status
          };
        } else {
          throw new Error(response.data?.message || 'Failed to create ad');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to create ad';
        
        const apiError = new Error(errorMessage);
        apiError.status = error.response?.status || 500;
        apiError.response = error.response;
        throw apiError;
      }
    },
    
    // Get all ads (fetches all pages and combines them)
    getAll: async (page = 1, limit = 100) => {
      try {
        // Fetch first page
        const firstResponse = await api.get(`/ads?page=1&limit=${limit}`);
        const baseData = firstResponse.data || {};
        let allAds = Array.isArray(baseData.data) ? [...baseData.data] : [];

        const pagination = baseData.pagination;

        // If there are multiple pages, fetch remaining pages in parallel
        if (pagination && pagination.totalPages && pagination.totalPages > 1) {
          const totalPages = pagination.totalPages;
          
          const pagePromises = [];
          for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
            pagePromises.push(
              api.get(`/ads?page=${currentPage}&limit=${limit}`)
                .then((res) => (res.data?.data || []))
                .catch(() => [])
            );
          }

          const remainingPages = await Promise.all(pagePromises);
          remainingPages.forEach((pageAds) => {
            allAds = allAds.concat(pageAds);
          });

          // Return combined data
          return {
            ...baseData,
            data: allAds,
            pagination: {
              ...(pagination || {}),
              total: allAds.length,
              page: 1,
              perPage: allAds.length,
              totalPages: 1,
            },
          };
        }

        // Single page - return as is
        return baseData;
      } catch (error) {
        console.error('[API] Get all ads failed:', error);
        throw error;
      }
    },
    
    // Get ad by ID (optimized - direct endpoint only)
    getById: async (id) => {
      if (!id) {
        const error = new Error('Ad ID is required');
        error.status = 400;
        throw error;
      }

      try {
        const response = await api.get(`/ads/${id}`);
        
        if (response.data) {
          return { data: response.data };
        }

        const error = new Error('Ad not found');
        error.status = 404;
        error.code = 'AD_NOT_FOUND';
        throw error;
      } catch (error) {
        if (!error.status) {
          error.status = error.response?.status || 500;
        }
        
        if (!error.code) {
          error.code = error.status === 404 ? 'AD_NOT_FOUND' : 'SERVER_ERROR';
        }
        
        throw error;
      }
    },

    // Get user's ads
    getMyAds: async (page = 1, perPage = 10) => {
      try {
        const response = await api.get(`/ads/my-ads?page=${page}&perPage=${perPage}`);
        return response.data;
      } catch (error) {
        console.error('[API] Get my ads failed:', error);
        throw error;
      }
    },

    // Delete an ad
    delete: async (adId) => {
      try {
        const response = await api.delete(`/delete-ad/${adId}`);
        return response.data;
      } catch (error) {
        console.error('[API] Delete ad failed:', error);
        throw error;
      }
    },

    // Get recent ads (fetches all pages)
    getRecentAds: async () => {
      try {
        // Fetch first page
        const response = await api.get('/ads?limit=100');
        
        // If there are multiple pages, fetch them all
        if (response.data?.pagination && response.data.pagination.totalPages > 1) {
          const allAds = [...response.data.data];
          const totalPages = response.data.pagination.totalPages;
          
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(
              api.get(`/ads?page=${page}&limit=100`)
                .then((res) => res.data?.data || [])
                .catch(() => [])
            );
          }
          
          const remainingPages = await Promise.all(pagePromises);
          remainingPages.forEach((pageAds) => {
            allAds.push(...pageAds);
          });
          
          // Return combined response
          return {
            ...response,
            data: {
              ...response.data,
              data: allAds,
              pagination: {
                ...response.data.pagination,
                total: allAds.length,
                page: 1,
                perPage: allAds.length,
                totalPages: 1
              }
            }
          };
        }
        
        return response;
      } catch (error) {
        console.error('[API] Error fetching recent ads:', error);
        throw error;
      }
    },
  },
  
  // Vehicle related APIs
  vehicles: {
    // Get vehicle filters
    getFilters: async () => {
      try {
        const response = await api.get('/vehiclesfilter');
        return response.data;
      } catch (error) {
        console.error('Error fetching vehicle filters:', error);
        return {
          types: [],
          brands: [],
          models: [],
          bodyTypes: []
        };
      }
    },
    
    // Get vehicle models by brand ID
    getModelsByBrand: async (brandId) => {
      try {
        const response = await api.get(`/v2/vehicles/models?brand_id=${brandId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching vehicle models:', error);
        return [];
      }
    },
    
    // Get featured vehicles
    getFeatured: async () => {
      try {
        const response = await api.get('/vehicles/featured');
        return response.data;
      } catch (error) {
        console.error('Error fetching featured vehicles:', error);
        return [];
      }
    },
  },
  
  // File upload API
  upload: {
    // Upload image file
    uploadImage: async (file) => {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await axios.post('https://api.emov.com.pk/v2/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          withCredentials: true
        });
        
        return response.data;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    },
    
    // Upload audio file
    uploadAudio: async (file) => {
      try {
        const formData = new FormData();
        formData.append('audio', file);
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await axios.post('https://api.emov.com.pk/v2/upload/audio', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          withCredentials: true
        });
        
        return response.data;
      } catch (error) {
        console.error('Error uploading audio:', error);
        throw error;
      }
    }
  },
  
  // User related APIs
  user: {
    // Get user profile
    getProfile: async () => {
      try {
        const response = await api.get('/api/user/profile', {
          validateStatus: status => status < 500
        });
        
        if (response.status === 404) {
          const userFromStorage = localStorage.getItem('user');
          if (userFromStorage) {
            return { data: JSON.parse(userFromStorage) };
          }
          return { 
            data: {
              name: 'User',
              email: '',
              phone: '',
              location: ''
            }
          };
        }
        
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
          return { data: response.data };
        }
        
        return { data: {} };
      } catch (error) {
        console.error('Error in getProfile:', error);
        return { 
          data: {
            name: 'User',
            email: '',
            phone: '',
            location: ''
          }
        };
      }
    },
    
    // Update user profile
    updateProfile: async (userData) => {
      try {
        const response = await api.put('/api/user/profile', userData);
        return response.data;
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
      
      return { data: {} };
    },
    
    // Login user
    login: async (email, password) => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        const response = await api.post('/auth/login', { email, password });
        
        let token, user;
        
        if (response.data && response.data.token) {
          token = response.data.token;
          user = response.data.user || {};
        }
        else if (response.data && response.data.data && response.data.data.token) {
          token = response.data.data.token;
          user = response.data.data.user || {};
        }
        else if (response.data && response.data.access_token) {
          token = response.data.access_token;
          user = response.data.user || {};
        }
        
        if (token) {
          localStorage.setItem('token', token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          return { 
            success: true, 
            token, 
            user,
            message: 'Login successful'
          };
        }
        
        const error = new Error('Invalid response format: No token found');
        error.response = response;
        throw error;
        
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (error.response?.data) {
          if (error.response.data.message) {
            error.message = error.response.data.message;
          } else if (error.response.data.error) {
            error.message = error.response.data.error;
          } else if (typeof error.response.data === 'string') {
            error.message = error.response.data;
          }
        }
        
        error.isAuthError = true;
        throw error;
      }
    },
    
    logout: async () => {
      try {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return response.data;
      } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw error;
      }
    },
    
    refreshToken: async () => {
      try {
        const response = await api.post('/auth/refresh-token', {}, {
          withCredentials: true,
        });
        return response.data;
      } catch (error) {
        console.error('Refresh token error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
        }
        throw error;
      }
    },
  },
};

// Utility function to handle 401 errors
export const handleUnauthorized = (options = {}) => {
  const { preventRedirect = false } = options;
  
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
};

// Global error handler for 401 errors and CORS errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.response && event.reason.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
  }
  else if (event.reason && event.reason.code === 'ERR_NETWORK' && 
           event.reason.message && event.reason.message.includes('CORS') &&
           event.reason.config && event.reason.config.url) {
    const url = event.reason.config.url;
    if (url.includes('/vehiclesfilter') || url.includes('/ads')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  }
});

export { api };
export default apiService;