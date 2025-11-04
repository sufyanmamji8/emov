import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaSearch, FaCar, FaMotorcycle, FaTruck, FaBus, FaShuttleVan, FaSun, FaMoon, FaGlobe, FaChevronLeft, FaChevronRight, FaSpinner, FaUser, FaSignOutAlt, FaCaretDown, FaImage, FaCarBattery, FaCrown, FaMoneyBillWave, FaShieldAlt, FaTools, FaCog, FaWater } from 'react-icons/fa';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('Category');
  const [language, setLanguage] = useState('english');
  const [scrollPositions, setScrollPositions] = useState({
    Category: 0,
    Budget: 0,
    Brand: 0,
    Model: 0,
    BodyType: 0
  });
  const [apiData, setApiData] = useState(null);
  const [vehiclesData, setVehiclesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Carousel state and functions
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(5); // Default for desktop
  const itemsPerPage = itemsPerRow * 2; // 2 rows of items
  
  // Update items per row based on screen size
  useEffect(() => {
    const updateItemsPerRow = () => {
      if (window.innerWidth < 640) { // Mobile
        setItemsPerRow(4); // 4 columns on mobile
      } else if (window.innerWidth < 768) { // Small screens
        setItemsPerRow(3);
      } else if (window.innerWidth < 1024) { // Medium screens
        setItemsPerRow(4);
      } else { // Large screens
        setItemsPerRow(5);
      }
    };
    
    // Set initial value
    updateItemsPerRow();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateItemsPerRow);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateItemsPerRow);
  }, []);
  const slideRef = useRef(null);
  
  // Update scrollLeft and scrollRight to work with carousel
  const scrollLeft = (tab) => {
    setCurrentSlide(prev => {
      const transformedData = transformApiData();
      const currentTabData = tab === 'Category' 
        ? transformedData.categories || [] 
        : transformedData[`${tab.toLowerCase()}s`] || [];
      const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
      return Math.max(prev - 1, 0);
    });
  };

  const scrollRight = (tab) => {
    setCurrentSlide(prev => {
      const transformedData = transformApiData();
      const currentTabData = tab === 'Category' 
        ? transformedData.categories || [] 
        : transformedData[`${tab.toLowerCase()}s`] || [];
      const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
      return Math.min(prev + 1, maxSlide);
    });
  };
  
  // Handle smooth scrolling for carousel
  useEffect(() => {
    if (slideRef.current) {
      slideRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
  }, [currentSlide]);
  
  // Update canScrollLeft and canScrollRight to work with carousel
  const canScrollLeft = (tab) => {
    return currentSlide > 0;
  };
  
  const canScrollRight = (tab) => {
    const transformedData = transformApiData();
    const currentTabData = tab === 'Category' 
      ? transformedData.categories || [] 
      : transformedData[`${tab.toLowerCase()}s`] || [];
    const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
    return currentSlide < maxSlide;
  };
  
  // Use the theme hook
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const scrollContainerRefs = {
    Category: useRef(null),
    Budget: useRef(null),
    Brand: useRef(null),
    Model: useRef(null),
    BodyType: useRef(null)
  };

  // Your exact color scheme
  const colors = {
    purple: '#935eef',
    green: '#00FFA9',
    gradient: 'linear-gradient(135deg, #2bd6a8 0%, #bda8e9 100%)'
  };

  // Carousel navigation functions are defined at the top of the component
  // These replace the old scroll functions

  // Handle unauthorized access
  const handleUnauthorized = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Handle token refresh
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/v2/refresh-token', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
    return false;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API if available
      await axios.post('/api/v2/logout', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // Fetch filter data from API
  // Fallback data in case API is not available
  const fallbackData = {
    category: [
      {
        VehicleTypeID: '1',
        CategoryName: 'Truck',
        CategoryNameUrdu: 'ٹرک',
        CategoryNameFrench: 'Camion',
        CategoryImage: 'truck.png'
      },
      {
        VehicleTypeID: '2',
        CategoryName: 'Tractor',
        CategoryNameUrdu: 'ٹریکٹر',
        CategoryNameFrench: 'Tracteur',
        CategoryImage: 'tractor.png'
      },
      // Add more fallback categories as needed
    ],
    budget: [
      { BudgetID: '1', MinAmount: '5000', MaxAmount: '10000', RangeLabel: '$5,000 - $10,000' },
      { BudgetID: '2', MinAmount: '10000', MaxAmount: '20000', RangeLabel: '$10,000 - $20,000' },
      // Add more budget ranges as needed
    ],
    bodyType: [
      { 
        BodyTypeID: '1', 
        BodyTypeName: 'Pickup',
        BodyTypeNameUrdu: 'پک اپ',
        BodyTypeNameFrench: 'Pick-up'
      },
      { 
        BodyTypeID: '2', 
        BodyTypeName: 'Truck',
        BodyTypeNameUrdu: 'ٹرک',
        BodyTypeNameFrench: 'Camion'
      },
      { 
        BodyTypeID: '3', 
        BodyTypeName: 'Trailer',
        BodyTypeNameUrdu: 'ٹریلر',
        BodyTypeNameFrench: 'Remorque'
      },
      { 
        BodyTypeID: '4', 
        BodyTypeName: 'Dumper',
        BodyTypeNameUrdu: 'ڈمپر',
        BodyTypeNameFrench: 'Benne basculante'
      },
      { 
        BodyTypeID: '5', 
        BodyTypeName: 'Tanker',
        BodyTypeNameUrdu: 'ٹینکر',
        BodyTypeNameFrench: 'Citerne'
      },
      { 
        BodyTypeID: '6', 
        BodyTypeName: 'Loader',
        BodyTypeNameUrdu: 'لوڈر',
        BodyTypeNameFrench: 'Chargeur'
      },
      { 
        BodyTypeID: '7', 
        BodyTypeName: 'Forklift',
        BodyTypeNameUrdu: 'فورک لفٹ',
        BodyTypeNameFrench: 'Chariot élévateur'
      },
      { 
        BodyTypeID: '8', 
        BodyTypeName: 'Crane',
        BodyTypeNameUrdu: 'کرین',
        BodyTypeNameFrench: 'Grue'
      },
      { 
        BodyTypeID: '9', 
        BodyTypeName: 'Excavator',
        BodyTypeNameUrdu: 'ایکسکیویٹر',
        BodyTypeNameFrench: 'Excavatrice'
      },
      { 
        BodyTypeID: '10', 
        BodyTypeName: 'Bulldozer',
        BodyTypeNameUrdu: 'بلڈوزر',
        BodyTypeNameFrench: 'Bouteur'
      }
    ]
  };

  const fetchFilterData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try the correct API endpoint
      try {
        console.log('Attempting to fetch filter data from API...');
        const response = await axios.get('/v2/vehiclesfilter', {
          baseURL: '/api', // This will make the full URL /api/v2/vehiclesfilter
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        if (response.data && response.data.data) {
          console.log('Successfully fetched filter data from API');
          setApiData(response.data.data);
          return;
        }
        throw new Error('No data received from API');
      } catch (apiError) {
        console.warn('API request failed, using fallback data', apiError);
        // Try with leading slash if the first attempt fails
        try {
          console.log('Trying API with different base URL...');
          const response = await axios.get('/v2/vehiclesfilter', {
            baseURL: '/api/', // Try with trailing slash
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 5000
          });
          
          if (response.data && response.data.data) {
            console.log('Successfully fetched filter data with alternative base URL');
            console.log('API Response data:', response.data.data); // Debug log
            // Check if bodyType data exists in the response
            if (response.data.data.bodyType) {
              console.log('Body types found in API response:', response.data.data.bodyType);
            } else if (response.data.data.bodytypes) {
              console.log('bodytypes found in API response:', response.data.data.bodytypes);
            } else {
              console.log('No body type data found in API response');
            }
            setApiData(response.data.data);
            return;
          }
        } catch (secondApiError) {
          console.warn('Alternative API URL also failed', secondApiError);
        }
      }
      
      // If all API attempts fail, use fallback data
      console.log('Using fallback data');
      setApiData(fallbackData);
      setError('Using offline data. Some features may be limited.');
      
    } catch (error) {
      console.error('Error in fetchFilterData:', error);
      // Use fallback data even if there's an error
      setApiData(fallbackData);
      setError('Using offline data due to an error. Some features may be limited.');
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Helper function to get first letter of username for profile picture
  const getUserInitial = (username) => {
    if (!username || typeof username !== 'string') return 'U';
    return username.trim().charAt(0).toUpperCase();
  };

  // Load data on component mount
  useEffect(() => {
    fetchFilterData();
    
    // Load user profile from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUserProfile(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [fetchFilterData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Set up axios interceptor for 401 responses
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Generate vehicle image paths using API endpoint with dynamic image names
  const generateVehicleImage = (brand, vehicleType, index, brandImage = null) => {
    // Base URL for all images
    const baseUrl = 'https://api.emov.com.pk/image/';
    
    // If we have a brand image, use it with the API URL
    if (brandImage) {
      // Remove any path or URL parts if present
      const cleanImageName = brandImage.split('/').pop();
      return `${baseUrl}${cleanImageName}`;
    }
    
    // Determine vehicle type based on brand name or category
    const getVehicleType = (brandName, category) => {
      const brandLower = (brandName || '').toLowerCase();
      const categoryLower = (category || '').toLowerCase();
      
      if (brandLower.includes('truck') || categoryLower.includes('truck')) return 'truck';
      if (brandLower.includes('motor') || categoryLower.includes('motor')) return 'motorcycle';
      if (brandLower.includes('bus') || categoryLower.includes('bus')) return 'bus';
      if (brandLower.includes('van') || categoryLower.includes('van')) return 'van';
      return 'car'; // Default to car
    };

    const vehicleTypeKey = getVehicleType(brand, vehicleType);
    const imageIndex = (index % 5) + 1; // Use 1-5 for image variations
    
    // Return path to server images using the API endpoint
    return `${baseUrl}${vehicleTypeKey}-${imageIndex}.jpg`;
  };

  // Fetch filter data and generate vehicles with images
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          handleUnauthorized();
          return;
        }

        console.log('Fetching filter data from vehiclesfilter endpoint...');
        const response = await axios.get('/api/v2/vehiclesfilter', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true,
          timeout: 30000
        });
        
        console.log('Filter API response received:', response.data);
        
        if (response.data && response.data.data) {
          setApiData(response.data.data);
          
          // Generate realistic vehicles data from filter data with proper images
          const vehicles = generateVehiclesFromFilterData(response.data.data);
          setVehiclesData(vehicles);
          console.log(`Generated ${vehicles.length} vehicles with images`);
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (err) {
        console.error('Error fetching filter data:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });

        if (err.response && err.response.status === 401) {
          handleUnauthorized();
        } else {
          setError('Failed to load vehicle data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Generate vehicles data from filter API response with proper image handling
  const generateVehiclesFromFilterData = (filterData) => {
    if (!filterData) return [];
    
    const vehicles = [];
    const brands = Array.isArray(filterData.brand) ? filterData.brand : [];
    const categories = Array.isArray(filterData.category) ? filterData.category : [];
    const models = Array.isArray(filterData.model) ? filterData.model : [];
    const bodyTypes = Array.isArray(filterData.body_type) ? filterData.body_type : [];
    
    // Get up to 12 featured vehicles or all available if less
    const vehicleCount = Math.min(12, Math.max(brands.length, categories.length, models.length) || 6);
    
    for (let i = 0; i < vehicleCount; i++) {
      const brand = brands[i % brands.length] || {};
      const category = categories[i % categories.length] || {};
      const model = models[i % models.length] || {};
      const bodyType = bodyTypes[i % bodyTypes.length] || {};
      
      const brandName = brand.BrandName || brand.name || 'Vehicle';
      const categoryName = category.CategoryName || category.name || 'Car';
      const modelName = model.ModelNameEnglish || model.name || 'Model';
      const bodyTypeName = bodyType.BodyTypeName || bodyType.name || 'Standard';
      
      // Get localized names based on current language
      const getLocalizedName = (item, type) => {
        if (!item) return '';
        if (language === 'urdu') {
          if (type === 'brand') return item.BrandNameUrdu || brandName;
          if (type === 'category') return item.CategoryNameUrdu || categoryName;
          if (type === 'model') return item.ModelNameUrdu || modelName;
        } else if (language === 'french') {
          if (type === 'brand') return item.BrandNameFrench || brandName;
          if (type === 'category') return item.CategoryNameFrench || categoryName;
          if (type === 'model') return item.ModelNameFrench || modelName;
        }
        return brandName;
      };

      const vehicle = {
        id: `vehicle-${i + 1}`,
        title: `${getLocalizedName(brand, 'brand')} ${getLocalizedName(model, 'model')} ${2020 + (i % 4)}`,
        price: `€${(15000 + (i * 2000)).toLocaleString()}`,
        year: `${2020 + (i % 4)}`,
        mileage: `${(50000 + (i * 10000)).toLocaleString()} km`,
        location: [
          language === 'urdu' ? ['کراچی', 'لاہور', 'اسلام آباد', 'فیصل آباد', 'پشاور', 'کوئٹہ'][i % 6] :
          language === 'french' ? ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes'][i % 6] :
          ['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven', 'The Hague', 'Groningen'][i % 6]
        ],
        image: generateVehicleImage(brandName, categoryName, i, brand.BrandImage),
        brand: getLocalizedName(brand, 'brand'),
        model: getLocalizedName(model, 'model'),
        category: getLocalizedName(category, 'category'),
        bodyType: bodyTypeName,
        isNew: i < 2, // First 2 vehicles are "new"
        isFeatured: i < 3, // First 3 vehicles are "featured"
        originalData: { brand, category, model, bodyType }
      };
      
      vehicles.push(vehicle);
    }
    
    return vehicles;
  };

  // Transform API data to match UI structure
  const transformApiData = useCallback(() => {
    // If no API data, return empty object to prevent errors
    if (!apiData || Object.keys(apiData).length === 0) {
      console.log('No API data available for transformation');
      return {};
    }

    console.log('Transforming API data. Available keys:', Object.keys(apiData)); // Debug log
    
    // Debug: Log the structure of the bodyType data if it exists
    if (apiData.bodyType) {
      console.log('Body type data found in apiData.bodyType:', apiData.bodyType);
      if (Array.isArray(apiData.bodyType) && apiData.bodyType.length > 0) {
        console.log('First body type item:', apiData.bodyType[0]);
      }
    } else if (apiData.bodytypes) {
      console.log('Body type data found in apiData.bodytypes:', apiData.bodytypes);
      if (Array.isArray(apiData.bodytypes) && apiData.bodytypes.length > 0) {
        console.log('First body type item:', apiData.bodytypes[0]);
      }
    } else {
      console.log('No body type data found in apiData');
    }

    // Helper function to get localized name for different item types
    const getLocalizedName = (item, type) => {
      if (!item) return 'Unknown';
      
      if (language === 'urdu') {
        if (type === 'category') return item.CategoryNameUrdu || item.CategoryName || item.name || 'نامعلوم';
        if (type === 'brand') return item.BrandNameUrdu || item.BrandName || item.name || 'نامعلوم';
        if (type === 'model') return item.ModelNameUrdu || item.ModelNameEnglish || item.name || 'نامعلوم';
        if (type === 'bodyType') return item.BodyTypeNameUrdu || item.BodyTypeName || item.name || 'نامعلوم';
        if (type === 'budget') return item.RangeLabel || (item.MinAmount && item.MaxAmount ? `$${item.MinAmount} - $${item.MaxAmount}` : 'نامعلوم');
        return item.name || 'نامعلوم';
      } 
      
      if (language === 'french') {
        if (type === 'category') return item.CategoryNameFrench || item.CategoryName || item.name || 'Inconnu';
        if (type === 'brand') return item.BrandNameFrench || item.BrandName || item.name || 'Inconnu';
        if (type === 'model') return item.ModelNameFrench || item.ModelNameEnglish || item.name || 'Inconnu';
        if (type === 'bodyType') return item.BodyTypeNameFrench || item.BodyTypeName || item.name || 'Inconnu';
        if (type === 'budget') return item.RangeLabel || (item.MinAmount && item.MaxAmount ? `$${item.MinAmount} - $${item.MaxAmount}` : 'Inconnu');
        return item.name || 'Inconnu';
      }
      
      // Default to English
      if (type === 'category') return item.CategoryName || item.name || 'Unknown';
      if (type === 'brand') return item.BrandName || item.name || 'Unknown';
      if (type === 'model') return item.ModelNameEnglish || item.name || 'Unknown';
      if (type === 'bodyType') return item.BodyTypeName || item.name || 'Unknown';
      if (type === 'budget') return item.RangeLabel || (item.MinAmount && item.MaxAmount ? `$${item.MinAmount} - $${item.MaxAmount}` : 'Unknown');
      return item.name || 'Unknown';
    };

    // Colors for different categories
    const colorsList = [
      '#4F46E5', '#7C3AED', '#DB2777', '#EA580C', '#059669',
      '#0284C7', '#9D174D', '#B45309', '#0D9488', '#1D4ED8'
    ];

    // Check if categories exist in the API response
    const categoriesData = apiData.category || apiData.categories || [];
    console.log('Categories data:', categoriesData); // Debug log

    const processedData = {
      categories: categoriesData.map((item, index) => {
        const categoryItem = {
          id: item.VehicleTypeID || item.id || `cat-${index + 1}`,
          name: getLocalizedName(item, 'category'),
          count: item.count || Math.floor(Math.random() * 100) + 20,
          color: colorsList[index % colorsList.length],
          displayName: getLocalizedName(item, 'category'),
          originalData: item,
          type: 'category'
        };

        // Handle category image
        if (item.CategoryImage) {
          const imageName = item.CategoryImage.split('/').pop();
          categoryItem.image = `https://api.emov.com.pk/image/${imageName}`;
        } else if (item.image) {
          const imageName = item.image.split('/').pop();
          categoryItem.image = `https://api.emov.com.pk/image/${imageName}`;
        } else {
          categoryItem.image = null;
        }

        return categoryItem;
      }),
      
      budgets: (apiData.budget || []).map((item, index) => ({
        id: item.BudgetID || `budget-${index + 1}`,
        name: getLocalizedName(item, 'budget'),
        min: item.MinAmount,
        max: item.MaxAmount,
        count: Math.floor(Math.random() * 80) + 10,
        color: colorsList[(index + 2) % colorsList.length],
        displayName: getLocalizedName(item, 'budget'),
        originalData: item,
        type: 'budget'
      })),
      
      // Get unique brands by BrandName to avoid duplicates and exclude 'Various' brand
      brands: (apiData.brand || [])
        .filter((item, index, self) => 
          index === self.findIndex((t) => (
            t.BrandName === item.BrandName
          )) && 
          item.BrandName !== 'Various'  // Exclude the 'Various' brand
        )
        .map((item, index) => ({
        id: item.BrandID || `brand-${index + 1}`,
        name: getLocalizedName(item, 'brand'),
        count: Math.floor(Math.random() * 200) + 50,
        color: colorsList[(index + 4) % colorsList.length],
        displayName: getLocalizedName(item, 'brand'),
        originalData: item,
        image: item.BrandImage ? `https://api.emov.com.pk/image/${item.BrandImage}` : null,
        type: 'brand'
      })),
      
      models: (apiData.model || []).map((item, index) => {
        const modelItem = {
          id: item.ModelID || `model-${index + 1}`,
          name: getLocalizedName(item, 'model'),
          count: Math.floor(Math.random() * 150) + 50,
          color: colorsList[(index + 6) % colorsList.length],
          displayName: getLocalizedName(item, 'model'),
          originalData: item,
          brandId: item.BrandID,
          type: 'model'
        };
        
        // Add model image if available
        if (item.ModelImage) {
          modelItem.image = `https://api.emov.com.pk/image/${item.ModelImage}`;
        } else if (item.image) {
          const imageName = item.image.split('/').pop();
          modelItem.image = `https://api.emov.com.pk/image/${imageName}`;
        }
        
        return modelItem;
      }),
      
      bodytypes: (() => {
        // Check both possible property names for body types
        const bodyTypesData = apiData.bodyType || apiData.bodytypes || [];
        console.log('Body types data:', bodyTypesData); // Debug log
        
        return bodyTypesData.map((item, index) => ({
          id: item.BodyTypeID || item.id || `body-${index + 1}`,
          name: getLocalizedName(item, 'bodyType'),
          count: item.count || Math.floor(Math.random() * 250) + 50,
          color: item.color || colorsList[(index + 8) % colorsList.length],
          displayName: getLocalizedName(item, 'bodyType'),
          originalData: item,
          type: 'bodytype',
          // Try to get image if available
          image: item.image || (item.BodyTypeImage ? `https://api.emov.com.pk/image/${item.BodyTypeImage}` : null)
        }));
      })()
    };

    return processedData;
  }, [apiData, language]);

  // Handle image errors with better fallback
  const handleImageError = (e, item, type = 'category') => {
    console.log(`Image failed to load for ${item.name || item.title || 'item'}, type: ${type}`, item);
    e.target.onerror = null; // Prevent infinite loop
    
    const baseUrl = 'https://api.emov.com.pk/image/';
    let fallbackPath = '';
    let displayText = (item.displayName || item.name || 'Item').substring(0, 1).toUpperCase();
    let color = item.color || '#935eef';
    
    // Create a colored SVG as fallback
    const createSvgPlaceholder = () => {
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}"/>
          <text x="50%" y="50%" font-family="Arial" font-size="48" text-anchor="middle" 
                dominant-baseline="middle" fill="white" font-weight="bold">
            ${displayText}
          </text>
        </svg>
      `)}`;
    };

    // Try to find an image URL in various possible locations
    if (!fallbackPath && item.originalData) {
      const data = item.originalData;
      if (data.CategoryImage) {
        fallbackPath = `${baseUrl}${data.CategoryImage}`;
      } else if (data.BrandImage) {
        fallbackPath = `${baseUrl}${data.BrandImage}`;
      } else if (data.image) {
        fallbackPath = data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`;
      }
    }

    // If we found a fallback path, try it
    if (fallbackPath) {
      e.target.src = fallbackPath;
      e.target.onerror = () => {
        e.target.src = createSvgPlaceholder();
      };
    } else {
      // No fallback path, use colored SVG directly
      e.target.src = createSvgPlaceholder();
    }
  };

  // Create colored background or image for items
  const createItemBackground = (item, type = 'category') => {
    // Determine the image URL based on the item type
    let imageUrl = item.image;
    const baseUrl = 'https://api.emov.com.pk/image/';
    
    // If no direct image URL, try to construct one based on the item type and data
    if (!imageUrl && item.originalData) {
      const data = item.originalData;
      if (type === 'category' && data.CategoryImage) {
        imageUrl = data.CategoryImage.startsWith('http') ? data.CategoryImage : `${baseUrl}${data.CategoryImage}`;
      } else if (type === 'brand' && data.BrandImage) {
        imageUrl = data.BrandImage.startsWith('http') ? data.BrandImage : `${baseUrl}${data.BrandImage}`;
      } else if (data.image) {
        imageUrl = data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`;
      }
    }
    
    // For category images, apply #9E9E9E color
    if (type === 'category' && imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={item.displayName || item.name || 'Category'}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      );
    }

    // If we have an image URL, try to display it with a fallback
    if (imageUrl) {
      const displayText = (item.displayName || item.name || 'Item').substring(0, 1).toUpperCase();
      const bgColor = item.color || colors.purple;
      
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={item.displayName || item.name || 'Item'} 
            className="max-w-full max-h-full object-contain"
            style={{
              maxWidth: '80%',
              maxHeight: '80%',
              objectFit: 'contain'
            }}
            onError={(e) => handleImageError(e, item, type)}
            loading="lazy"
          />
        </div>
      );
    }
    
    // Otherwise use colored background with text
    return (
      <div 
        className="w-full h-full flex items-center justify-center text-white font-bold text-xs p-2 text-center"
        style={{ 
          backgroundColor: (item && item.color) || colors.purple,
          backgroundImage: (item && item.color) ? 'none' : colors.gradient
        }}
      >
        {item ? (item.displayName || item.name || item.title || 'Item') : 'Loading...'}
      </div>
    );
  };

  // Default translations
  const defaultTranslations = {
    english: {
      browseUsedVehicles: "Browse Used Vehicles",
      recentlyAdded: "Recently Added",
      featuredVehicles: "Featured Vehicles",
      otherServices: "Other Services",
      searchPlaceholder: "Search for vehicles...",
      findVehicles: "Find Used Commercial Vehicles",
      tagline: "Thousands of vehicles. One that fits you.",
      viewAll: "View All",
      view: "View",
      new: "New",
      viewDetails: "View Details",
      sellVehicle: "Sell Your Vehicle with Confidence",
      sellDescription: "List your vehicle for free and reach thousands of buyers",
      postAd: "Post Free Ad Now",
      tabs: {
        category: "Category",
        budget: "Budget",
        brand: "Brand",
        model: "Model",
        bodytype: "Body Type"
      },
      vehicles: "vehicles",
      error: {
        loading: "Loading vehicle data...",
        retry: "Retry",
        timeout: "Request timeout",
        connection: "Connection error"
      }
    },
    urdu: {
      browseUsedVehicles: "استعمال شدہ گاڑیاں براؤز کریں",
      recentlyAdded: "حال ہی میں شامل",
      featuredVehicles: "نمایاں گاڑیاں",
      otherServices: "دیگر خدمات",
      searchPlaceholder: "گاڑیوں کی تلاش کریں...",
      findVehicles: "استعمال شدہ کامرسل گاڑیاں تلاش کریں",
      tagline: "ہزاروں گاڑیاں۔ ایک جو آپ کے لیے موزوں ہو۔",
      viewAll: "سب دیکھیں",
      view: "دیکھیں",
      new: "نیا",
      viewDetails: "تفصیلات دیکھیں",
      sellVehicle: "اعتماد کے ساتھ اپنی گاڑی فروخت کریں",
      sellDescription: "مفت میں اپنی گاڑی درج کریں اور ہزاروں خریداروں تک پہنچیں",
      postAd: "مشتہر مفت پوسٹ کریں",
      tabs: {
        category: "زمرہ",
        budget: "بجٹ",
        brand: "برانڈ",
        model: "ماڈل",
        bodytype: "باڈی ٹائپ"
      },
      vehicles: "گاڑیاں",
      error: {
        loading: "گاڑیوں کا ڈیٹا لوڈ ہو رہا ہے...",
        retry: "دوبارہ کوشش کریں",
        timeout: "درخواست کا وقت ختم",
        connection: "کنکشن کی خرابی"
      }
    },
    french: {
      browseUsedVehicles: "Parcourir les Véhicules d'Occasion",
      recentlyAdded: "Récemment Ajouté",
      featuredVehicles: "Véhicules en Vedette",
      otherServices: "Autres Services",
      searchPlaceholder: "Rechercher des véhicules...",
      findVehicles: "Trouver des Véhicules Commerciaux d'Occasion",
      tagline: "Des milliers de véhicules. Celui qui vous convient.",
      viewAll: "Voir Tout",
      view: "Voir",
      new: "Nouveau",
      viewDetails: "Voir Détails",
      sellVehicle: "Vendez Votre Véhicule en Toute Confiance",
      sellDescription: "Annoncez votre véhicule gratuitement et atteignez des milliers d'acheteurs",
      postAd: "Publier une Annonce Gratuite",
      tabs: {
        category: "Catégorie",
        budget: "Budget",
        brand: "Marque",
        model: "Modèle",
        bodytype: "Type de Carrosserie"
      },
      vehicles: "véhicules",
      error: {
        loading: "Chargement des données véhicules...",
        retry: "Réessayer",
        timeout: "Délai d'attente dépassé",
        connection: "Erreur de connexion"
      }
    }
  };

  // Get translations
  const getTranslations = () => {
    if (!apiData) return defaultTranslations;

    const filterTypes = {
      english: apiData.allFilterType || ['Category', 'Budget', 'Brand', 'Model', 'Body Type'],
      urdu: apiData.allFilterTypeUrdu || ['زمرہ', 'بجٹ', 'برانڈ', 'ماڈل', 'باڈی ٹائپ'],
      french: apiData.allFilterTypeFrench || ['Catégorie', 'Budget', 'Marque', 'Modèle', 'Type de carrosserie']
    };

    return {
      english: {
        ...defaultTranslations.english,
        tabs: {
          category: filterTypes.english[0] || "Category",
          budget: filterTypes.english[1] || "Budget",
          brand: filterTypes.english[2] || "Brand",
          model: filterTypes.english[3] || "Model",
          bodytype: filterTypes.english[4] || "Body Type"
        }
      },
      urdu: {
        ...defaultTranslations.urdu,
        tabs: {
          category: filterTypes.urdu[0] || "زمرہ",
          budget: filterTypes.urdu[1] || "بجٹ",
          brand: filterTypes.urdu[2] || "برانڈ",
          model: filterTypes.urdu[3] || "ماڈل",
          bodytype: filterTypes.urdu[4] || "باڈی ٹائپ"
        }
      },
      french: {
        ...defaultTranslations.french,
        tabs: {
          category: filterTypes.french[0] || "Catégorie",
          budget: filterTypes.french[1] || "Budget",
          brand: filterTypes.french[2] || "Marque",
          model: filterTypes.french[3] || "Modèle",
          bodytype: filterTypes.french[4] || "Type de Carrosserie"
        }
      }
    };
  };

  const translations = getTranslations();
  const t = translations[language] || translations.english;

  // Categories data
  const categories = [
    { id: 1, name: 'Cars', icon: <FaCar className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 2, name: 'Motorcycles', icon: <FaMotorcycle className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 3, name: 'Trucks', icon: <FaTruck className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 4, name: 'Buses', icon: <FaBus className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 5, name: 'Vans', icon: <FaShuttleVan className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 6, name: 'SUVs', icon: <FaCar className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 7, name: 'Electric', icon: <FaCarBattery className="w-6 h-6 sm:w-7 sm:h-7" /> },
    { id: 8, name: 'Luxury', icon: <FaCrown className="w-6 h-6 sm:w-7 sm:h-7" /> },
  ];

  // Recently Added Vehicles Data
  const recentlyAddedVehicles = [
    {
      id: 1,
      title: 'Toyota Corolla 2022',
      price: '$24,500',
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2022',
      mileage: '15,000 km',
      location: 'Karachi',
      isNew: true
    },
    {
      id: 2,
      title: 'Honda Civic 2021',
      price: '$22,300',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2021',
      mileage: '25,000 km',
      location: 'Lahore',
      isNew: false
    },
    {
      id: 3,
      title: 'Suzuki Alto 2023',
      price: '$12,500',
      image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2023',
      mileage: '5,000 km',
      location: 'Islamabad',
      isNew: true
    },
    {
      id: 4,
      title: 'Toyota Fortuner 2020',
      price: '$35,000',
      image: 'https://images.unsplash.com/photo-1605296830714-7b02d5cbf1e6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2020',
      mileage: '45,000 km',
      location: 'Rawalpindi',
      isNew: false
    }
  ];

  // Featured Vehicles Data
  const featuredVehicles = [
    {
      id: 101,
      title: 'Mercedes-Benz S-Class 2023',
      price: '$120,000',
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2023',
      mileage: '2,500 km',
      location: 'Karachi',
      isFeatured: true,
      rating: 4.8,
      features: ['Premium Sound', 'Leather Seats', 'Sunroof']
    },
    {
      id: 102,
      title: 'BMW X7 2022',
      price: '$95,000',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2022',
      mileage: '12,000 km',
      location: 'Lahore',
      isFeatured: true,
      rating: 4.7,
      features: ['7 Seater', 'Panoramic Roof', 'Heated Seats']
    },
    {
      id: 103,
      title: 'Audi e-tron 2023',
      price: '$85,000',
      image: 'https://images.unsplash.com/photo-1622049599805-7635cbd00a6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2023',
      mileage: '3,200 km',
      location: 'Islamabad',
      isFeatured: true,
      rating: 4.9,
      features: ['Electric', 'Quattro AWD', 'Virtual Cockpit']
    },
    {
      id: 104,
      title: 'Range Rover Sport 2022',
      price: '$110,000',
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      year: '2022',
      mileage: '8,500 km',
      location: 'Karachi',
      isFeatured: true,
      rating: 4.6,
      features: ['Terrain Response', 'Air Suspension', 'Meridian Sound']
    }
  ];

  // Other Services Data
  const otherServices = [
    {
      id: 1,
      name: 'Tyre',
      icon: <img src="/tyre.png" alt="Tyre" className="w-12 h-12 mx-auto mb-2 object-contain" />
    },
    {
      id: 2,
      name: 'Option 2',
      icon: <img src="/option 2.png" alt="Option2" className="w-12 h-12 mx-auto mb-2 object-contain" />
    },
    {
      id: 3,
      name: 'Option3',
      icon: <img src="/option 3.png" alt="Option3" className="w-12 h-12 mx-auto mb-2 object-contain" />
    },
    {
      id: 4,
      name: 'Option4',
      icon: <img src="/option 4.png" alt="Option4" className="w-12 h-12 mx-auto mb-2 object-contain" />
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t.error.loading}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`border rounded-lg max-w-md p-6 ${isDark ? 'bg-gray-800 border-gray-700 text-red-400' : 'bg-red-50 border-red-400 text-red-700'}`}>
            <p className="font-bold mb-2">Error</p>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              {t.error.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen  ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header 
        className="relative  pt-4 sm:pt-6 pb-12 sm:pb-16 w-full z-20 border-b border-white border-opacity-20"
        style={{ 
          background: colors.gradient,
          position: 'relative'
        }}
      >
        <div className="w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Logo and Controls Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-8 sm:gap-12">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                <img 
                  src="/loginemov.png" 
                  alt="Emov Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="h-6 sm:h-7 md:h-8">
                <img 
                  src="/emovfont.png" 
                  alt="Emov" 
                  className="h-full w-auto"
                />
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-8 sm:space-x-10 md:space-x-12">
              <a 
                href="/dashboard" 
                className={`relative text-base sm:text-lg font-medium ${window.location.pathname === '/dashboard' ? 'text-white' : 'text-white/80 hover:text-white'} group transition-colors duration-300`}
              >
                Home
                <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full ${window.location.pathname === '/dashboard' ? 'w-full' : ''}`}></span>
              </a>
              <a 
                href="/chats" 
                className={`relative text-base sm:text-lg font-medium ${window.location.pathname === '/chats' ? 'text-white' : 'text-white/80 hover:text-white'} group transition-colors duration-300`}
              >
                Chats
                <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full ${window.location.pathname === '/chats' ? 'w-full' : ''}`}></span>
              </a>
              <a 
                href="/my-ads" 
                className={`relative text-base sm:text-lg font-medium ${window.location.pathname === '/my-ads' ? 'text-white' : 'text-white/80 hover:text-white'} group transition-colors duration-300`}
              >
                My Ads
                <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full ${window.location.pathname === '/my-ads' ? 'w-full' : ''}`}></span>
              </a>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 w-full sm:w-auto justify-between sm:justify-normal">
              {/* Language Selector */}
              <div className="relative">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200 border border-white border-opacity-20 rounded-md"
                >
                  <option value="english">EN</option>
                  <option value="urdu">UR</option>
                  <option value="french">FR</option>
                </select>
                <FaGlobe className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="text-white hover:text-gray-200 focus:outline-none p-2 sm:p-2.5 bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 hover:scale-105 border border-white border-opacity-20 rounded-xl"
                style={{ borderRadius: '12px' }}
              >
                {isDark ? <FaSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* User Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-1 sm:space-x-2 text-white hover:text-gray-200 focus:outline-none transition-colors group"
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="true"
                >
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white bg-opacity-10 group-hover:bg-opacity-20 flex items-center justify-center transition-all duration-200 border border-white border-opacity-20 overflow-hidden"
                    style={{ borderRadius: '12px' }}
                  >
                    {userProfile?.picture ? (
                      <img 
                        src={userProfile.picture} 
                        alt={userProfile?.username || 'User'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`${userProfile?.picture ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                      <span className="text-sm font-medium text-white">
                        {getUserInitial(userProfile?.username || 'User')}
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {userProfile?.username || 'User'}
                  </span>
                  <FaCaretDown className={`w-2 h-2 sm:w-3 sm:h-3 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                <div 
                  className={`absolute right-0 mt-2 w-56 shadow-xl border z-50 transition-all duration-200 ease-out transform origin-top-right ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } ${showProfileDropdown 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                  <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-white text-lg font-medium ${
                        userProfile?.picture ? 'overflow-hidden' : 'bg-purple-500'
                      }`}>
                        {userProfile?.picture ? (
                          <img 
                            src={userProfile.picture} 
                            alt={userProfile?.username || 'User'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`${userProfile?.picture ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                          {getUserInitial(userProfile?.username || 'User')}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userProfile?.username || 'User Name'}
                        </p>
                        <p className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          {userProfile?.email || 'user@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center space-x-2 px-3 py-2.5 text-sm transition-colors ${
                        isDark 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FaSignOutAlt className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Text */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 px-2">
              {t.findVehicles}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base px-2">
              {t.tagline}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto px-2 sm:px-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-2 sm:py-3 bg-white shadow-lg border-0 focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                style={{ borderRadius: '12px' }}
                placeholder={t.searchPlaceholder}
              />
              <button className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto mt-4 sm:mt-6 relative z-10">
        {/* Browse Used Vehicles Section */}
        <div className={`shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 w-full border rounded-xl ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t.browseUsedVehicles}</h2>
          
          {/* Tabs */}
          <div className="flex overflow-x-auto sm:overflow-visible mb-4 sm:mb-6 md:mb-8 no-scrollbar">
            <div className={`flex space-x-2 p-1.5 rounded-xl`}>
              {['Category', 'Budget', 'Brand', 'Model', 'BodyType'].map((tab, index) => (
                <button
                  key={tab}
                  className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                    activeTab === tab
                      ? (isDark 
                          ? 'bg-gray-700 text-white border-gray-500' 
                          : 'bg-white text-purple-600 border-purple-400 shadow-sm')
                      : (isDark 
                          ? `text-gray-300 hover:text-white hover:bg-gray-700/50 border-transparent hover:border-gray-500` 
                          : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50 border-transparent hover:border-gray-300')
                  } rounded-lg whitespace-nowrap`}
                  onClick={() => setActiveTab(tab)}
                >
                  {t.tabs[tab.toLowerCase()] || tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content with 2-line Navigation */}
          <div className="relative">
            <button
              onClick={() => scrollLeft(activeTab)}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl border-2 ${
                isDark 
                  ? 'border-gray-600 hover:border-gray-500 text-white hover:bg-gray-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-800 hover:bg-gray-50'
              } transition-all duration-200 ${!canScrollLeft(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canScrollLeft(activeTab)}
            >
              <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-180" />
            </button>

            <button
              onClick={() => scrollRight(activeTab)}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl border-2 ${
                isDark 
                  ? 'border-gray-600 hover:border-gray-500 text-white hover:bg-gray-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-800 hover:bg-gray-50'
              } transition-all duration-200 ${!canScrollRight(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canScrollRight(activeTab)}
            >
              <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Carousel Container */}
            <div className="relative w-full overflow-hidden">
              {/* Carousel Track */}
              <div 
                ref={slideRef}
                className="flex transition-transform duration-300 ease-in-out w-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {(() => {
                  const transformedData = transformApiData();
                  let currentTabData = [];
                  
                  // Handle data for different tabs
                  const tabDataMap = {
                    'Category': 'categories',
                    'Model': 'models',
                    'Brand': 'brands',
                    'BodyType': 'bodytypes',  // Changed from 'bodyTypes' to 'bodytypes' to match the transformed data key
                    'Budget': 'budgets'
                  };
                  
                  const dataKey = tabDataMap[activeTab] || `${activeTab.toLowerCase()}s`;
                  currentTabData = Array.isArray(transformedData[dataKey]) ? 
                    transformedData[dataKey] : [];

                  if (currentTabData.length === 0) {
                    return (
                      <div className="w-full py-8 text-center flex-shrink-0" style={{ width: '100%' }}>
                        <p className="text-gray-500">
                          {t.noDataAvailable || 'No data available for this category'}
                        </p>
                      </div>
                    );
                  }

                  // Calculate number of slides needed
                  const totalSlides = Math.ceil(currentTabData.length / itemsPerPage);
                  const slides = [];

                  // Create slides with items
                  for (let i = 0; i < totalSlides; i++) {
                    const slideItems = currentTabData.slice(i * itemsPerPage, (i + 1) * itemsPerPage);

                    slides.push(
                      <div 
                        key={`slide-${i}`} 
                        className="flex-shrink-0 w-full"
                        style={{ width: '100%' }}
                      >
                        <div className={`grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full px-2 sm:px-4`}>
                          {slideItems.map((item, index) => {
                            const displayName = item.displayName || item.name || item.CategoryName || 'Unnamed Category';
                            const itemCount = typeof item.count === 'number' ? item.count : 0;
                            
                            // Standard card layout for all tabs
                            const cardContent = () => (
                              <div className="flex flex-col items-center justify-center p-3 h-full w-full">
                                {item.image || item.icon ? (
                                  <div className="w-10 h-10 mb-2 flex items-center justify-center">
                                    {item.icon ? (
                                      <div style={{ color: '#9E9E9E' }}>
                                        {React.cloneElement(item.icon, { size: 24 })}
                                      </div>
                                    ) : (
                                      <img 
                                        src={item.image} 
                                        alt={displayName}
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    )}
                                    {!item.icon && (
                                      <div className="hidden w-full h-full items-center justify-center text-[#9E9E9E]">
                                        {displayName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                                <div className="text-center w-full">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                    {displayName}
                                  </div>
                                </div>
                              </div>
                            );

                            // Return the appropriate card wrapper based on tab
                            if (['Budget', 'BodyType', 'Category', 'Brand', 'Model'].includes(activeTab)) {
                              return (
                                <div 
                                  key={`${item.id || index}-${activeTab}`}
                                  className={`relative flex flex-col h-full rounded-lg cursor-pointer transition-all duration-200 ${
                                    isDark 
                                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' 
                                      : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300'
                                  }`}
                                  style={{
                                    minHeight: '90px',
                                    boxShadow: isDark 
                                      ? '0 2px 4px rgba(0,0,0,0.3)' 
                                      : '0 2px 6px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {cardContent()}
                                </div>
                              );
                            }
                            
                            // Card layout for Model tab (text-based with colored background)
                            if (activeTab === 'Model') {
                              return (
                                <div 
                                  key={`${item.id || index}-${activeTab}`}
                                  className={`flex items-center justify-center p-3 rounded-lg text-center cursor-pointer transition-all duration-200 h-full ${
                                    isDark 
                                      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-500' 
                                      : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-purple-300'
                                  }`}
                                  style={{
                                    minHeight: '80px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <div className="font-medium text-sm">
                                    {displayName}
                                    {itemCount > 0 && (
                                      <div className="text-xs mt-1 opacity-70">
                                        {itemCount} {t.vehicles || 'vehicles'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Card layout for other tabs (Category, Brand, etc.)
                            return (
                              <div 
                                key={`${item.id || index}-${activeTab}`}
                                className={`relative flex flex-col h-full rounded-xl overflow-hidden transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-md ${
                                  isDark 
                                    ? 'bg-gray-700 border border-gray-600' 
                                    : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                                }`}
                                style={{
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                              >
                                {/* Image Container */}
                                <div className="relative pt-[75%] bg-gray-100">
                                  <div className="absolute inset-0 flex items-center justify-center p-4">
                                    {createItemBackground(item, item.type || activeTab.toLowerCase())}
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-3 flex-1 flex flex-col">
                                  <h3 
                                    className={`text-sm font-semibold text-center ${
                                      isDark ? 'text-white' : 'text-gray-800'
                                    }`}
                                    title={displayName}
                                  >
                                    {displayName}
                                  </h3>
                                  {itemCount > 0 && (
                                    <div className="mt-1 text-center">
                                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {itemCount} {t.vehicles || 'vehicles'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return slides;
                })()}
              </div>

            </div>
          </div>
        </div>

        {/* Recently Added Section */}
        <div className="mb-6 sm:mb-8 w-full border rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold">{t.recentlyAdded}</h2>
            <button 
              className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 transition-all duration-300 hover:shadow-lg w-full sm:w-auto text-center"
              style={{ 
                backgroundColor: colors.purple,
                color: 'white'
              }}
            >
              {t.viewAll}
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {recentlyAddedVehicles.map((vehicle) => (
              <div 
                key={vehicle.id} 
                className={`overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="h-48 sm:h-56 md:h-64 relative overflow-hidden">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => handleImageError(e, vehicle)}
                    loading="lazy"
                  />
                  {vehicle.isNew && (
                    <div 
                      className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: colors.purple }}
                    >
                      {t.new}
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
                    <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {vehicle.title}
                    </h3>
                    <span 
                      className="text-lg font-bold text-right sm:text-left"
                      style={{ color: colors.purple }}
                    >
                      {vehicle.price}
                    </span>
                  </div>
                  <div className={`flex items-center text-xs sm:text-sm space-x-2 mb-3 sm:mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span>{vehicle.year}</span>
                    <span>•</span>
                    <span>{vehicle.mileage}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {vehicle.location}
                    </span>
                    <button 
                      className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 transition-all duration-300 hover:shadow-lg w-full sm:w-auto text-center"
                      style={{ 
                        backgroundColor: colors.purple,
                        color: 'white'
                      }}
                    >
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Vehicles Section */}
        <div className="mb-6 sm:mb-8 w-full border rounded-xl overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t.featuredVehicles}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredVehicles.map((vehicle) => (
              <div 
                key={vehicle.id} 
                className={`overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="h-48 sm:h-56 md:h-64 relative overflow-hidden">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => handleImageError(e, vehicle)}
                    loading="lazy"
                  />
                  {vehicle.isNew && (
                    <div 
                      className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: colors.purple }}
                    >
                      {t.new}
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1 sm:gap-0">
                    <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                      {vehicle.title}
                    </h3>
                    <span 
                      className="text-base sm:text-lg font-bold text-right sm:text-left"
                      style={{ color: colors.purple }}
                    >
                      {vehicle.price}
                    </span>
                  </div>
                  <div className={`flex items-center text-xs sm:text-sm space-x-2 mb-3 sm:mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span>{vehicle.year}</span>
                    <span>•</span>
                    <span>{vehicle.mileage}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {vehicle.location}
                    </span>
                    <button 
                      className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 transition-all duration-300 hover:shadow-lg w-full sm:w-auto text-center"
                      style={{ 
                        backgroundColor: colors.purple,
                        color: 'white'
                      }}
                    >
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Services Section */}
        <div className="mb-6 sm:mb-8 w-full border rounded-xl overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t.otherServices}</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {otherServices.map((service, index) => (
              <div 
                key={index}
                className={`border p-3 sm:p-4 md:p-6 text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                style={{ borderColor: colors.purple + '20' }}
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{service.icon}</div>
                <span className="text-xs sm:text-sm font-semibold">{service.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Your Vehicle Section */}
        <div 
          className="p-4 sm:p-6 md:p-8 text-white mb-6 sm:mb-8 overflow-hidden relative w-full"
          style={{ background: colors.gradient }}
        >
          <div className="relative z-10 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">{t.sellVehicle}</h2>
            <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
              {t.sellDescription}
            </p>
            <button 
              className="bg-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-sm sm:text-base"
              style={{ color: colors.purple }}
            >
              {t.postAd}
            </button>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-white opacity-10"></div>
          <div className="absolute -top-8 -left-8 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white opacity-10"></div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className={`py-8 sm:py-12 w-full ${isDark ? 'bg-gray-800' : 'bg-gray-900'} text-white`}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-6 lg:gap-0">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                  <img 
                    src="/loginemov.png" 
                    alt="Emov Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="h-5 sm:h-6 md:h-8">
                  <img 
                    src="/emovfont.png" 
                    alt="Emov" 
                    className="h-full w-auto"
                  />
                </div>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">Find your next vehicle with confidence</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 w-full lg:w-auto">
              {['Company', 'Support', 'Legal'].map((section) => (
                <div key={section}>
                  <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: colors.green }}>{section}</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {['About Us', 'Careers', 'Blog'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
              <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
                © {new Date().getFullYear()} Emov. All rights reserved.
              </p>
              <div className="flex space-x-4 sm:space-x-6">
                {['Facebook', 'Twitter', 'Instagram'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;