import axios from 'axios';

// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.MODE === 'development' ? '/v2' : 'https://api.emov.com.pk/v2';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout for better reliability
  withCredentials: false, // Set to false to avoid CORS preflight issues
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
    // Log the original request
    console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
      params: config.params,
      data: config.data instanceof FormData ? '[FormData]' : config.data
    });

    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Log token status (without logging the actual token for security)
    console.log(`[API] Token available: ${!!token}`);
    console.log(`[API] Request URL: ${config.url}`);
    console.log(`[API] Full request URL: ${API_BASE_URL}${config.url}`);
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Added Authorization header to request');
    } else {
      console.warn('[API] No authentication token found');
      
      // Add X-PLATFORM header for unauthorized requests to specific endpoints
      const isVehicleFilterRequest = config.url?.includes('vehiclesfilter');
      const isVehicleModelsRequest = config.url?.includes('/vehicles/models');
      const isFeaturedVehiclesRequest = config.url?.includes('/vehicles/featured');
      const isAdsRequest = config.url?.includes('/ads') && !config.url?.includes('/my-ads');
      
      if (isVehicleFilterRequest || isVehicleModelsRequest || isFeaturedVehiclesRequest || isAdsRequest) {
        config.headers['X-PLATFORM'] = 'WEB';
        let endpointType = 'ads';
        if (isVehicleFilterRequest) endpointType = 'vehicle filter';
        else if (isVehicleModelsRequest) endpointType = 'vehicle models';
        else if (isFeaturedVehiclesRequest) endpointType = 'featured vehicles';
        
        console.log(`[API] Added X-PLATFORM: WEB header for ${endpointType} request`);
      }
    }

    // Handle FormData - let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('[API] Handling FormData - removed Content-Type header');
    }

    // Add cache-busting parameter for GET requests
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
      console.log('[API] Added cache-busting parameter to GET request');
    }

    // Log request for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
        headers: config.headers,
        params: config.params,
        data: config.data instanceof FormData ? '[FormData]' : config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`[API] Response ${response.status} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error('[API] Request failed:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message,
      response: error.response?.data,
      headers: error.response?.headers
    });
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      const isLogoutAction = originalRequest?.url?.includes('/auth/logout');
      
      // Don't try to refresh token if this is a logout action
      if (isLogoutAction) {
        console.log('[API] Logout action detected, skipping token refresh');
        return Promise.reject(error);
      }
      
      // Check if this is a refresh token request to prevent infinite loops
      if (originalRequest.url.includes('/auth/refresh')) {
        console.log('[API] Refresh token failed, logging out...');
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        
        // Don't redirect - let the components handle it
        return Promise.reject(error);
      }

      // Check if this is an unauthorized request to vehicle endpoints or ads endpoints
      // These endpoints should work without authentication when X-PLATFORM: WEB is sent
      const isVehicleFilterRequest = originalRequest?.url?.includes('vehiclesfilter');
      const isVehicleModelsRequest = originalRequest?.url?.includes('/vehicles/models');
      const isFeaturedVehiclesRequest = originalRequest?.url?.includes('/vehicles/featured');
      const isAdsRequest = originalRequest?.url?.includes('/ads') && !originalRequest?.url?.includes('/my-ads');
      const hasPlatformHeader = originalRequest?.headers?.['X-PLATFORM'] === 'WEB';
      
      if (isVehicleFilterRequest || isVehicleModelsRequest || isFeaturedVehiclesRequest || isAdsRequest) {
        if (hasPlatformHeader) {
          let endpointType = 'ads';
          if (isVehicleFilterRequest) endpointType = 'vehicle filter';
          else if (isVehicleModelsRequest) endpointType = 'vehicle models';
          else if (isFeaturedVehiclesRequest) endpointType = 'featured vehicles';
          
          console.log(`[API] 401 error on ${endpointType} endpoint with X-PLATFORM header - API might require additional configuration`);
          // Don't clear auth data for these endpoints when X-PLATFORM header is present
          return Promise.reject(error);
        } else {
          let endpointType = 'ads';
          if (isVehicleFilterRequest) endpointType = 'vehicle filter';
          else if (isVehicleModelsRequest) endpointType = 'vehicle models';
          else if (isFeaturedVehiclesRequest) endpointType = 'featured vehicles';
          
          console.log(`[API] 401 error on ${endpointType} endpoint without X-PLATFORM header`);
        }
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
        console.error('[API] Token refresh failed:', refreshError);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        
        // Don't redirect - let the components handle it
        return Promise.reject(refreshError);
      }
    }
    
    // Handle CORS errors that might be 401s
    if (error.code === 'ERR_NETWORK' && error.message.includes('CORS')) {
      console.warn('[API] CORS error detected - this might be a 401 error');
      // Check if this is likely an auth error based on the URL
      const isVehicleFilterRequest = originalRequest?.url?.includes('vehiclesfilter');
      const isVehicleModelsRequest = originalRequest?.url?.includes('/vehicles/models');
      const isFeaturedVehiclesRequest = originalRequest?.url?.includes('/vehicles/featured');
      const isAdsRequest = originalRequest?.url?.includes('/ads') && !originalRequest?.url?.includes('/my-ads');
      const hasPlatformHeader = originalRequest?.headers?.['X-PLATFORM'] === 'WEB';
      
      if (isVehicleFilterRequest || isVehicleModelsRequest || isFeaturedVehiclesRequest || isAdsRequest) {
        if (hasPlatformHeader) {
          let endpointType = 'ads';
          if (isVehicleFilterRequest) endpointType = 'vehicle filter';
          else if (isVehicleModelsRequest) endpointType = 'vehicle models';
          else if (isFeaturedVehiclesRequest) endpointType = 'featured vehicles';
          
          console.log(`[API] CORS error on ${endpointType} endpoint with X-PLATFORM header - don't clear auth data`);
          // Don't clear auth data for these endpoints when X-PLATFORM header is present
          return Promise.reject(error);
        } else {
          console.log('[API] CORS error on protected endpoint without X-PLATFORM header');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
        }
      }
      // Don't redirect - let the components handle it
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
        console.log('[API] 🚀 Starting ad creation request...');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Log the incoming formData for debugging
        console.log('[API] 📥 Incoming formData:', formData);
        
        // Prepare the request data - DON'T MODIFY Images FIELD
        const requestData = { ...formData };
        
        // Log the Images field as-is
        console.log('[API] 📷 Images data (as received):', {
          value: requestData.Images,
          type: typeof requestData.Images
        });
        
        // ✅ FIX: Ensure VehiclePower is a string with unit
        if (requestData.VehiclePower && typeof requestData.VehiclePower === 'number') {
          requestData.VehiclePower = `${requestData.VehiclePower} HP`;
          console.log('[API] ✅ Converted VehiclePower to string:', requestData.VehiclePower);
        }
        
        // Ensure all numeric fields are properly converted to numbers
        const numericFields = ['VehicleModelID', 'VehiclePrice', 'VehicleTypeID', 'VehicleBrandID', 'VehicleBodyTypeID'];
        
        numericFields.forEach(field => {
          if (requestData[field] !== undefined && requestData[field] !== '') {
            requestData[field] = Number(requestData[field]);
            console.log(`[API] Converted ${field} to number:`, requestData[field]);
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
        
        // Log the final request data
        console.log('[API] 📤 Final request payload:', requestData);
        console.log('[API] 📝 Raw request data:', JSON.stringify(requestData, null, 2));
        
        // Make the API request to create the ad
        console.log('[API] 📡 Sending create ad request...');
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
        
        console.log('[API] ✅ Create ad successful:', response.data);
        
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
        console.log('[API] === ERROR DEBUG ===');
        console.log('[API] Error status:', error.response?.status);
        console.log('[API] Error data:', error.response?.data);
        console.log('[API] Error message:', error.message);
        console.log('[API] Full error:', error);
        console.log('[API] === END ERROR DEBUG ===');
        
        console.error('[API] Create ad failed:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          request: error.config?.data ? JSON.parse(error.config.data) : 'No request data'
        });
        
        // Create a more detailed error message
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
    
    // Get all ads (with pagination support)
    getAll: async (page = 1, limit = 100) => {
      try {
        console.log(`[API] 🚀 Fetching ads (page ${page}, limit ${limit})`);

        // Always start from page 1 to be able to aggregate all pages
        const firstResponse = await api.get(`/ads?page=1&limit=${limit}`);
        const baseData = firstResponse.data || {};
        let allAds = Array.isArray(baseData.data) ? [...baseData.data] : [];

        const pagination = baseData.pagination;

        // If there are multiple pages, fetch and merge them all
        if (pagination && pagination.totalPages && pagination.totalPages > 1) {
          const totalPages = pagination.totalPages;
          console.log(`[API] 📊 Multiple pages detected: ${totalPages} total pages`);

          const pagePromises = [];
          for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
            pagePromises.push(
              api
                .get(`/ads?page=${currentPage}&limit=${limit}`)
                .then((res) => {
                  const pageData = res.data || {};
                  const ads = Array.isArray(pageData.data) ? pageData.data : [];
                  console.log(`[API] ✅ Fetched page ${currentPage}: ${ads.length} ads`);
                  return ads;
                })
                .catch((err) => {
                  console.warn(`[API] ⚠️ Failed to fetch page ${currentPage}:`, err.message);
                  return [];
                })
            );
          }

          const remainingPages = await Promise.all(pagePromises);
          remainingPages.forEach((pageAds) => {
            allAds = allAds.concat(pageAds);
          });

          console.log(`[API] 🎉 Combined ads from all pages: ${allAds.length} total`);

          // Return same shape as original API but with merged data
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

        // Single-page case: just return the base data as-is
        console.log(`[API] ✅ Single-page ads response: ${allAds.length} ads`);
        return baseData;
      } catch (error) {
        console.error('[API] Get all ads failed:', error);
        throw error;
      }
    },
    
    // Get ad by ID
    getById: async (id) => {
      if (!id) {
        const error = new Error('Ad ID is required');
        error.status = 400;
        throw error;
      }

      console.log(`[API] Fetching ad with ID: ${id}`);
      
      try {
        // First try the direct endpoint if it exists
        try {
          console.log(`[API] Trying direct endpoint: /ads/${id}`);
          const response = await api.get(`/ads/${id}`);
          
          if (response.data) {
            console.log(`[API] Successfully fetched ad ${id} from direct endpoint`);
            return { data: response.data };
          }
        } catch (directError) {
          // Only log if it's not a 404, as we expect 404 for non-existent ads
          if (directError.response?.status !== 404) {
            console.warn(`[API] Direct endpoint failed for ad ${id}:`, directError.message);
          } else {
            console.log(`[API] Ad ${id} not found via direct endpoint, trying fallback`);
          }
        }

        // Fallback: Fetch all ads (pagination-aware) and filter
        console.log(`[API] Falling back to fetching all ads`);
        const allAdsResponse = await apiService.ads.getAll(1, 100);
        const allAds = allAdsResponse?.data || [];
        console.log(`[API] Fetched ${allAds.length} total ads`);

        const targetIdStr = String(id).trim();

        const ad = allAds.find(ad => {
          const possibleIds = [ad.AdID, ad.id, ad.adId, ad.adID].filter(Boolean);
          return possibleIds.some(pid => String(pid) === targetIdStr);
        });

        if (ad) {
          console.log(`[API] Found ad ${id} in full ads list`);
          return { data: ad };
        }

        // Return a consistent error response
        console.warn(`[API] Ad ${id} not found in any data source`);
        const error = new Error('Ad not found');
        error.status = 404;
        error.code = 'AD_NOT_FOUND';
        throw error;
      } catch (error) {
        // Only log if it's not a 404, as those are handled gracefully in the UI
        if (error.status !== 404) {
          console.error(`[API] Get ad by ID ${id} failed:`, error);
        }
        
        // Ensure error has a status code
        if (!error.status) {
          error.status = error.response?.status || 500;
        }
        
        // Add error code if not present
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

    // Get recent ads for Recently Added section
    getRecentAds: async () => {
      try {
        console.log('[API] Fetching recent ads...');
        
        // First, get the total count and first page
        const response = await api.get('/ads?limit=100');
        console.log('[API] Full response:', response);
        console.log('[API] Response data:', response.data);
        console.log('[API] Data array:', response.data?.data);
        console.log('[API] Data length:', response.data?.data?.length);
        console.log('[API] Pagination:', response.data?.pagination);
        
        // If we have pagination and more pages, fetch all pages
        if (response.data?.pagination && response.data.pagination.totalPages > 1) {
          const allAds = [...response.data.data];
          const totalPages = response.data.pagination.totalPages;
          
          // Fetch remaining pages
          for (let page = 2; page <= totalPages; page++) {
            console.log(`[API] Fetching page ${page} of ${totalPages}`);
            const pageResponse = await api.get(`/ads?page=${page}&limit=100`);
            if (pageResponse.data?.data) {
              allAds.push(...pageResponse.data.data);
            }
          }
          
          // Return combined response with all ads
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
        console.log('Trying alternative endpoint with slash...');
        try {
          const altResponse = await api.get('/vehiclesfilter');
          return altResponse.data;
        } catch (altError) {
          console.error('All filter endpoints failed:', {
            altError: altError.message
          });
          return {
            types: [],
            brands: [],
            models: [],
            bodyTypes: []
          };
        }
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
  
  // User related APIs
  user: {
    // Get user profile
    getProfile: async () => {
      try {
        const response = await api.get('/api/user/profile', {
          // Don't throw on 404, we'll handle it
          validateStatus: status => status < 500
        });
        
        // If we get a 404, return a default user
        if (response.status === 404) {
          console.log('Profile endpoint not found, using default user');
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
        
        // For other successful responses
        if (response.data) {
          // Save to localStorage for offline use
          localStorage.setItem('user', JSON.stringify(response.data));
          return { data: response.data };
        }
        
        // Fallback if no data
        return { data: {} };
      } catch (error) {
        console.error('Error in getProfile:', error);
        // Return default user on error
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
  
  // File upload API
  upload: {
    // Upload image file
    uploadImage: async (file) => {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        // Get token for authorization
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await axios.post('https://api.emov.com.pk/v2/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          withCredentials: true
        });
        
        console.log('Image upload successful:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
  },
  
  // Auth related APIs
  auth: {
    login: async (email, password) => {
      try {
        // Clear any existing tokens before login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Make the login request
        const response = await api.post('/auth/login', { email, password });
        
        console.log('Login response:', response.data);
        
        // Handle different response formats
        let token, user;
        
        // Check for response.data.token (direct token)
        if (response.data && response.data.token) {
          token = response.data.token;
          user = response.data.user || {};
        }
        // Check for response.data.data.token (nested token)
        else if (response.data && response.data.data && response.data.data.token) {
          token = response.data.data.token;
          user = response.data.data.user || {};
        }
        // Check for response.data.access_token (OAuth style)
        else if (response.data && response.data.access_token) {
          token = response.data.access_token;
          user = response.data.user || {};
        }
        
        if (token) {
          // Store the token and user data
          localStorage.setItem('token', token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          // Return the user data
          return { 
            success: true, 
            token, 
            user,
            message: 'Login successful'
          };
        }
        
        // If we get here, the token wasn't found in the expected format
        const error = new Error('Invalid response format: No token found');
        error.response = response;
        throw error;
        
      } catch (error) {
        console.error('Login error:', error);
        
        // Clear any existing tokens on login error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Extract error message from response if available
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          // Try to get error message from response
          if (error.response.data) {
            if (error.response.data.message) {
              error.message = error.response.data.message;
            } else if (error.response.data.error) {
              error.message = error.response.data.error;
            } else if (typeof error.response.data === 'string') {
              error.message = error.response.data;
            }
          }
        }
        
        // Add more context to the error
        error.isAuthError = true;
        throw error;
      }
    },
    
    logout: async () => {
      try {
        const response = await api.post('/auth/logout');
        // Clear local storage on successful logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return response.data;
      } catch (error) {
        console.error('Logout error:', error);
        // Clear local storage even if the request fails
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
        // If refresh fails, clear the token
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          // Don't redirect - let the components handle it
        }
        throw error;
      }
    },
  },
};

// Utility function to handle 401 errors
export const handleUnauthorized = (options = {}) => {
  const { preventRedirect = false } = options;
  console.log('[API] Handling unauthorized access', { preventRedirect });
  
  // Clear auth data
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  // Never redirect automatically - let the components handle it
  console.log('[API] Auth data cleared, no automatic redirect');
};

// Global error handler for 401 errors and CORS errors
window.addEventListener('unhandledrejection', (event) => {
  // Check for 401 errors
  if (event.reason && event.reason.response && event.reason.response.status === 401) {
    console.log('[API] Unhandled 401 error, logging out...');
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    
    // Don't redirect automatically - let the components handle it
    console.log('[API] Auth data cleared from global handler, no automatic redirect');
  }
  // Check for CORS errors on protected endpoints
  else if (event.reason && event.reason.code === 'ERR_NETWORK' && 
           event.reason.message && event.reason.message.includes('CORS') &&
           event.reason.config && event.reason.config.url) {
    const url = event.reason.config.url;
    if (url.includes('/vehiclesfilter') || url.includes('/ads') || url.includes('/ads')) {
      console.log('[API] CORS error on protected endpoint');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      // Don't redirect - let the components handle it
      console.log('[API] Auth data cleared from CORS error, no automatic redirect');
    }
  }
});

export { api };
export default apiService;