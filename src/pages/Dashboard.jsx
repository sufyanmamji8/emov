import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaSearch, FaCar, FaMotorcycle, FaTruck, FaBus, FaShuttleVan, FaSun, FaMoon, FaGlobe, FaChevronLeft, FaChevronRight, FaUser, FaSignOutAlt, FaCaretDown, FaImage, FaCarBattery, FaCrown, FaMoneyBillWave, FaShieldAlt, FaTools, FaCog, FaWater } from 'react-icons/fa';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';
import Navbar from '../components/Layout/Navbar'; // Import the Navbar component from the correct path

// Gradient image paths from public folder - Vite requires paths to public assets to be absolute from the public folder
const gradientLeft = '/gradientleft.png';
const gradientRight = '/gradientright bottom.png';

// Debug: Log image paths and check if they're accessible
console.log('Gradient Left Path:', gradientLeft);
console.log('Gradient Right Path:', gradientRight);

// Check if images are accessible
const checkImage = (url) => {
  const img = new Image();
  img.onload = () => console.log(`✅ Image loaded successfully: ${url}`);
  img.onerror = () => console.error(`❌ Failed to load image: ${url}`);
  img.src = url;
};

checkImage(gradientLeft);
checkImage(gradientRight);

// Carousel Navigation Component
const CarouselNavigation = ({ onPrev, onNext, canGoPrev, canGoNext, section }) => (
  <>
    <button
      onClick={onPrev}
      disabled={!canGoPrev}
      className={`absolute -left-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors ${!canGoPrev ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={`Previous ${section}`}
    >
      <FaChevronLeft className="w-6 h-6 text-gray-700" />
    </button>
    <button
      onClick={onNext}
      disabled={!canGoNext}
      className={`absolute -right-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors ${!canGoNext ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={`Next ${section}`}
    >
      <FaChevronRight className="w-6 h-6 text-gray-700" />
    </button>
  </>
);

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
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    // Initialize with data from localStorage if available
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const profile = JSON.parse(userData);
        // Construct the full image URL if imageUrl exists
        if (profile.imageUrl && !profile.imageUrl.startsWith('http')) {
          profile.picture = `https://api.emov.com.pk/${profile.imageUrl.replace(/^\//, '')}`;
        }
        return profile;
      }
    } catch (e) {
      console.error('Error initializing user profile:', e);
    }
    return null;
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Carousel state and functions
  const [currentSlides, setCurrentSlides] = useState({
    'Category': 0,
    'Budget': 0,
    'Brand': 0,
    'Model': 0,
    'Body Type': 0,
    'Recently Added': 0,
    'Featured Vehicles': 0
  });
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
  const scrollLeft = (tab, items = null, itemsPerRow = 4) => {
    setCurrentSlides(prevSlides => {
      if (tab === 'Recently Added' || tab === 'Featured Vehicles') {
        const maxSlide = Math.ceil((items || []).length / (itemsPerRow * 2)) - 1;
        const newSlide = Math.max(prevSlides[tab] - 1, 0);
        return { ...prevSlides, [tab]: newSlide };
      } else {
        const transformedData = transformApiData();
        const currentTabData = tab === 'Category' 
          ? transformedData.categories || [] 
          : transformedData[`${tab.toLowerCase()}s`] || [];
        const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
        const newSlide = Math.max(prevSlides[tab] - 1, 0);
        return { ...prevSlides, [tab]: newSlide };
      }
    });
  };

  const scrollRight = (tab, items = null, itemsPerRow = 4) => {
    setCurrentSlides(prevSlides => {
      if (tab === 'Recently Added' || tab === 'Featured Vehicles') {
        const maxSlide = Math.ceil((items || []).length / (itemsPerRow * 2)) - 1;
        const newSlide = Math.min(prevSlides[tab] + 1, maxSlide);
        return { ...prevSlides, [tab]: newSlide };
      } else {
        const transformedData = transformApiData();
        const currentTabData = tab === 'Category' 
          ? transformedData.categories || [] 
          : transformedData[`${tab.toLowerCase()}s`] || [];
        const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
        const newSlide = Math.min(prevSlides[tab] + 1, maxSlide);
        return { ...prevSlides, [tab]: newSlide };
      }
    });
  };
  
  // Handle smooth scrolling for carousel
  useEffect(() => {
    if (slideRef.current) {
      slideRef.current.style.transform = `translateX(-${currentSlides[activeTab] * 100}%)`;
    }
  }, [currentSlides, activeTab]);
  
  // Update canScrollLeft and canScrollRight to work with carousel
  const canScrollLeft = (tab) => {
    return currentSlides[tab] > 0;
  };
  
  const canScrollRight = (tab, items = null, itemsPerRow = 4) => {
    if (tab === 'Recently Added' || tab === 'Featured Vehicles') {
      const maxSlide = Math.ceil((items || []).length / (itemsPerRow * 2)) - 1;
      return currentSlides[tab] < maxSlide;
    } else {
      const transformedData = transformApiData();
      const currentTabData = tab === 'Category' 
        ? transformedData.categories || [] 
        : transformedData[`${tab.toLowerCase()}s`] || [];
      const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
      return currentSlides[tab] < maxSlide;
    }
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

  const [apiError, setApiError] = useState(null);

  const fetchFilterData = useCallback(async () => {
    // Skip if we already have data
    if (apiData) return;
    
    try {
      console.log('Fetching filter data...');
      const endpoints = [
        { baseURL: '/api', path: '/v2/vehiclesfilter' },
        { baseURL: '/api/', path: '/v2/vehiclesfilter' },
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint.path, {
            baseURL: endpoint.baseURL,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 8000 // Increased timeout to 8 seconds
          });
          
          if (response.data?.data) {
            console.log('Successfully fetched filter data');
            setApiData(response.data.data);
            setApiError(null);
            return;
          }
        } catch (err) {
          console.warn(`API request to ${endpoint.baseURL} failed:`, err.message);
          // Continue to next endpoint if this one fails
        }
      }
      
      // If all API attempts fail, use fallback data
      console.log('All API attempts failed, using fallback data');
      setApiData(fallbackData);
      setApiError('Using offline data. Some features may be limited.');
      
    } catch (error) {
      console.error('Unexpected error in fetchFilterData:', error);
      setApiData(fallbackData);
      setApiError('Failed to load data. Using limited offline mode.');
    } finally {
    }
  }, [apiData]);

  // Helper function to get first letter of username for profile picture
  const getUserInitial = (username) => {
    if (!username || typeof username !== 'string') return 'U';
    return username.trim().charAt(0).toUpperCase();
  };

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileDropdown = document.getElementById('profile-dropdown');
      const profileButton = document.getElementById('profile-button');
      
      if (profileDropdown && profileButton && !profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
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
        const token = localStorage.getItem('token');
        if (!token) {
          handleUnauthorized();
          return;
        }

        const response = await axios.get('/api/v2/vehiclesfilter', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true,
          timeout: 30000
        });
        
        if (response.data?.data) {
          setApiData(response.data.data);
          const vehicles = generateVehiclesFromFilterData(response.data.data);
          setVehiclesData(vehicles);
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          handleUnauthorized();
        } else if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching filter data:', {
            message: err.message,
            status: err.response?.status
          });
        }
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
      return {};
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
      image: '/mockvehicle.png',
      year: '2022',
      mileage: '15,000 km',
      location: 'Karachi',
      isNew: true
    },
    {
      id: 2,
      title: 'Honda Civic 2021',
      price: '$22,300',
      image: '/mockvehicle.png',
      year: '2021',
      mileage: '25,000 km',
      location: 'Lahore',
      isNew: false
    },
    {
      id: 3,
      title: 'Suzuki Alto 2023',
      price: '$12,500',
      image: '/mockvehicle.png',
      year: '2023',
      mileage: '5,000 km',
      location: 'Islamabad',
      isNew: true
    },
    {
      id: 4,
      title: 'Toyota Fortuner 2020',
      price: '$35,000',
      image: '/mockvehicle.png',
      year: '2020',
      mileage: '45,000 km',
      location: 'Rawalpindi',
      isNew: false
    },
    {
      id: 5,
      title: 'Hyundai Elantra 2021',
      price: '$18,500',
      image: '/mockvehicle.png',
      year: '2021',
      mileage: '20,000 km',
      location: 'Karachi',
      isNew: false
    },
    {
      id: 6,
      title: 'Kia Sportage 2022',
      price: '$28,000',
      image: '/mockvehicle.png',
      year: '2022',
      mileage: '12,000 km',
      location: 'Lahore',
      isNew: true
    },
    {
      id: 7,
      title: 'Honda City 2020',
      price: '$16,800',
      image: '/mockvehicle.png',
      year: '2020',
      mileage: '35,000 km',
      location: 'Islamabad',
      isNew: false
    },
    {
      id: 8,
      title: 'Toyota Hilux 2021',
      price: '$32,000',
      image: '/mockvehicle.png',
      year: '2021',
      mileage: '30,000 km',
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
      image: '/mockvehicle.png',
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
      image: '/mockvehicle.png',
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
      image: '/mockvehicle.png',
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
      image: '/mockvehicle.png',
      year: '2022',
      mileage: '8,500 km',
      location: 'Karachi',
      isFeatured: true,
      rating: 4.6,
      features: ['Terrain Response', 'Air Suspension', 'Meridian Sound']
    },
    {
      id: 105,
      title: 'Porsche 911 2023',
      price: '$145,000',
      image: '/mockvehicle.png',
      year: '2023',
      mileage: '1,200 km',
      location: 'Lahore',
      isFeatured: true,
      rating: 4.9,
      features: ['Sport Chrono', 'PDK Transmission', 'Active Suspension']
    },
    {
      id: 106,
      title: 'Tesla Model X 2023',
      price: '$99,000',
      image: '/mockvehicle.png',
      year: '2023',
      mileage: '5,000 km',
      location: 'Islamabad',
      isFeatured: true,
      rating: 4.8,
      features: ['Ludicrous Mode', 'Autopilot', 'Falcon Wing Doors']
    },
    {
      id: 107,
      title: 'Lamborghini Urus 2022',
      price: '$250,000',
      image: '/mockvehicle.png',
      year: '2022',
      mileage: '7,500 km',
      location: 'Karachi',
      isFeatured: true,
      rating: 4.7,
      features: ['4-Wheel Steering', 'Carbon Ceramic Brakes', 'Alcantara Interior']
    },
    {
      id: 108,
      title: 'Rolls-Royce Cullinan 2023',
      price: '$350,000',
      image: '/mockvehicle.png',
      year: '2023',
      mileage: '3,500 km',
      location: 'Lahore',
      isFeatured: true,
      rating: 4.9,
      features: ['Bespoke Interior', 'Starlight Headliner', 'Air Suspension']
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

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`border rounded-lg max-w-md p-6 ${isDark ? 'bg-gray-800 border-gray-700 text-red-400' : 'bg-red-50 border-red-400 text-red-700'}`}>
            <p className="font-bold mb-2">Network Error</p>
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
    <div className="min-h-screen bg-white text-gray-800">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 w-full h-full">
        {/* Left Green Gradient */}
        <div className="absolute left-0 top-0 h-full w-1/3" style={{
          backgroundImage: `url(${gradientLeft})`,
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left center',
          zIndex: 0
        }}></div>
        
        {/* Bottom Right Blue Gradient */}
        <div className="absolute right-0 bottom-0 h-1/2 w-1/3" style={{
          backgroundImage: `url(${gradientRight})`,
          backgroundSize: '100% auto',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right bottom',
          zIndex: 0
        }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">

        {/* Top Header Section */}
        <div className="bg-white/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex justify-between items-center h-8 sm:h-10">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--emov-green, #00FFA9)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Download App</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-sm font-medium text-gray-700">
                Sign In
              </button>
              <button className="text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--emov-green, #0DFF9A)',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Sign Up
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* Navbar Section */}
        <div className="relative">
          <Navbar 
            isDark={isDark}
            toggleTheme={toggleTheme}
            language={language}
            setLanguage={setLanguage}
            userProfile={userProfile}
            handleLogout={handleLogout}
          />
        </div>

        {/* Hero Section */}
        <section className="relative w-full" style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          paddingBottom: '2rem'
        }}>
        <div className="relative max-w-[2000px] mx-auto">
          <div className="relative w-full z-10 min-h-[250px] sm:min-h-[300px] pt-8 sm:pt-12 pb-12 sm:pb-16">
            
            {/* Content */}
            <div className="relative z-10 pt-8 sm:pt-12 pb-12 sm:pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Hero Text */}
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
                  {t.findVehicles}
                </h1>
                <p className="text-gray-800 text-base sm:text-lg max-w-2xl mx-auto">
                  {t.tagline}
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none z-10">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6 text-emov-purple" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      style={{
                        minWidth: '24px',
                        minHeight: '24px'
                      }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 bg-white/90 backdrop-blur-sm border-2 border-white/80 focus:border-emov-purple/70 focus:ring-2 focus:ring-emov-purple/30 text-sm sm:text-base placeholder-gray-500 text-gray-800"
                    style={{ 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    placeholder={t.searchPlaceholder}
                  />
                  <button className="absolute inset-y-0 right-0 pr-4 sm:pr-5 flex items-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-emov-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="w-full bg-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full rounded-xl overflow-hidden shadow-sm">
            <img 
              src="/banner.png" 
              alt="Special Offers" 
              className="w-full h-auto"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full relative z-10">
        {/* Browse Used Vehicles Section with Tabs */}
        <section className="w-full bg-gray-100 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full bg-transparent rounded-xl overflow-hidden">
              <div className="w-full p-6 bg-gray-100 rounded-t-lg">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">{t.browseUsedVehicles}</h2>
                
                {/* Tabs with underline for active state */}
                <div className="w-full overflow-x-auto pb-1">
                  <div className="flex space-x-1 border-b border-gray-100 w-max min-w-full">
                    {['Category', 'Budget', 'Brand', 'Model', 'Body Type'].map((tab) => (
                      <button
                        key={tab}
                        className={`px-4 py-3 text-sm sm:text-base font-medium whitespace-nowrap relative ${
                          activeTab === tab
                            ? 'text-emov-purple after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emov-purple'
                            : 'text-gray-600'
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Tab Content with 2-line Navigation */}
              <div className="relative w-full pb-6 px-6 bg-gray-100 rounded-lg shadow-sm">
                <button
                  onClick={() => scrollLeft(activeTab)}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg border-2 border-gray-100 text-gray-800 ${!canScrollLeft(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canScrollLeft(activeTab)}
                >
                  <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-180" />
                </button>

                <button
                  onClick={() => scrollRight(activeTab)}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg border-2 border-gray-100 text-gray-800 ${!canScrollRight(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                style={{ transform: `translateX(-${currentSlides[activeTab] * 100}%)` }}
              >
                {(() => {
                  const transformedData = transformApiData();
                  let currentTabData = [];
                  
                  // Handle data for different tabs
                  const tabDataMap = {
                    'Category': 'categories',
                    'Model': 'models',
                    'Brand': 'brands',
                    'Body Type': 'bodytypes',  // Match the exact tab name 'Body Type' with the data key 'bodytypes'
                    'Budget': 'budgets'
                  };
                  
                  // Convert activeTab to match the expected format (handle spaces)
                  const normalizedTab = activeTab.replace(/\s+/g, ' ');
                  let dataKey = tabDataMap[normalizedTab];
                  
                  // If no direct match, try to find a matching key
                  if (!dataKey) {
                    const lowerTab = normalizedTab.toLowerCase().replace(/\s+/g, '');
                    dataKey = Object.entries(tabDataMap).find(([key]) => 
                      key.toLowerCase().replace(/\s+/g, '') === lowerTab
                    )?.[1];
                  }
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
                                  <div className="text-xs sm:text-sm font-medium text-text-primary line-clamp-2">
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
                                  className={`relative flex flex-col h-full rounded-lg cursor-pointer ${
                                    isDark 
                                      ? 'bg-gray-800 border border-gray-600' 
                                      : 'bg-white border-2 border-gray-100'
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
                                  className={`flex items-center justify-center p-4 rounded-lg text-center cursor-pointer h-full ${
                                    isDark 
                                      ? 'bg-gray-700 text-white border border-gray-500' 
                                      : 'bg-white text-gray-800 border-2 border-gray-300'
                                  }`}
                                  style={{
                                    minHeight: '100px',
                                    minWidth: '140px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <div className="font-medium text-sm">
                                    {displayName}
                                    {itemCount > 0 && (
                                      <div className="text-xs mt-2 text-gray-500">
                                        {itemCount} {t.vehicles || 'vehicles'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Card layout for Body Type tab (similar to Model but without vehicle count)
                            if (activeTab === 'Body Type') {
                              return (
                                <div 
                                  key={`${item.id || index}-${activeTab}`}
                                  className={`flex items-center justify-center p-4 rounded-lg text-center cursor-pointer h-full ${
                                    isDark 
                                      ? 'bg-gray-700 text-white border border-gray-500' 
                                      : 'bg-white text-gray-800 border-2 border-gray-300'
                                  }`}
                                  style={{
                                    minHeight: '100px',
                                    minWidth: '140px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <div className="font-medium text-sm">
                                    {displayName}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Card layout for other tabs (Category, Brand, etc.)
                            return (
                              <div 
                                key={`${item.id || index}-${activeTab}`}
                                className={`relative flex flex-col h-full rounded-xl overflow-hidden cursor-pointer ${
                                  isDark 
                                    ? 'bg-gray-700 border border-gray-600' 
                                    : 'bg-white border-2 border-gray-100'
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
              </div> {/* End of carousel track */}
            </div> {/* End of carousel container */}
          </div> {/* End of tab content */}
        </div> {/* End of white rounded container */}
      </div> {/* End of max-w-7xl container */}
    </section>

        {/* Other Services Section */}
        <section className="w-full bg-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">{t.otherServices}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {otherServices.map((service, index) => (
                <div 
                  key={index}
                  className={`overflow-hidden rounded-lg shadow-lg border p-4 sm:p-5 text-center cursor-pointer ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-3 text-emov-purple">{service.icon}</div>
                  <span className="text-sm sm:text-base font-medium text-gray-800">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="w-full bg-gray-100 py-12 sm:py-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.recentlyAdded}</h2>
            </div>
            
            <div className="relative">
              <CarouselNavigation
                onPrev={() => scrollLeft('Recently Added', recentlyAddedVehicles, 4)}
                onNext={() => scrollRight('Recently Added', recentlyAddedVehicles, 4)}
                canGoPrev={canScrollLeft('Recently Added')}
                canGoNext={canScrollRight('Recently Added', recentlyAddedVehicles, 4)}
                section="recently added vehicles"
              />
              
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-300"
                  style={{
                    transform: `translateX(-${currentSlides['Recently Added'] * 100}%)`,
                    width: '100%',
                    transition: 'transform 0.3s ease-in-out'
                  }}
                >
                  {Array(Math.ceil(recentlyAddedVehicles.length / 4)).fill().map((_, groupIndex) => (
                    <div 
                      key={groupIndex}
                      className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1"
                      style={{ minWidth: '100%' }}
                    >
                      {recentlyAddedVehicles.slice(groupIndex * 4, (groupIndex + 1) * 4).map((vehicle) => (
                        <div 
                          key={vehicle.id} 
                          className="group bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col h-full transition-shadow duration-300 hover:shadow-md"
                        >
                          <div className="relative h-48 w-full overflow-hidden">
                            <img 
                              src="/mockvehicle.png" 
                              alt={vehicle.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            {vehicle.isNew && (
                              <div className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white bg-black rounded">
                                {t.new}
                              </div>
                            )}
                          </div>
                            <div className="p-4 flex-grow flex flex-col">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{vehicle.title.split(' ').slice(0, 2).join(' ')}</h3>
                              <span className="text-lg font-bold text-emov-purple mb-2">{vehicle.price}</span>
                              
                              <div className="flex items-center text-sm text-gray-500 mb-3">
                                <span>{vehicle.title.split(' ').slice(2).join(' ')}</span>
                                <span className="mx-2">•</span>
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {vehicle.mileage}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{vehicle.location}</span>
                              </div>
                              
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Vehicles Section */}
        <section className="w-full bg-white py-12 sm:py-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.featuredVehicles}</h2>
            </div>
            
            <div className="relative">
              <CarouselNavigation
                onPrev={() => scrollLeft('Featured Vehicles', featuredVehicles, 4)}
                onNext={() => scrollRight('Featured Vehicles', featuredVehicles, 4)}
                canGoPrev={canScrollLeft('Featured Vehicles')}
                canGoNext={canScrollRight('Featured Vehicles', featuredVehicles, 4)}
                section="featured vehicles"
              />
              
              <div className="relative overflow-hidden">
                
                <div 
                  className="flex transition-transform duration-300"
                  style={{
                    transform: `translateX(-${currentSlides['Featured Vehicles'] * 100}%)`,
                    width: '100%',
                    transition: 'transform 0.3s ease-in-out'
                  }}
                >
                  {Array(Math.ceil(featuredVehicles.length / 4)).fill().map((_, groupIndex) => (
                    <div 
                      key={groupIndex}
                      className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1"
                      style={{ minWidth: '100%' }}
                    >
                      {[
                        {
                          id: 1,
                          title: 'Toyota Camry 2020',
                          price: '$24,000',
                          year: '2020',
                          mileage: '35,000 km',
                          transmission: 'Automatic',
                          fuel: 'Petrol',
                          location: 'New York',
                          isNew: true
                        },
                        {
                          id: 2,
                          title: 'Honda Civic 2021',
                          price: '$22,500',
                          year: '2021',
                          mileage: '25,000 km',
                          transmission: 'Automatic',
                          fuel: 'Hybrid',
                          location: 'Los Angeles',
                          isNew: false
                        },
                        {
                          id: 3,
                          title: 'BMW 3 Series 2019',
                          price: '$32,000',
                          year: '2019',
                          mileage: '28,000 km',
                          transmission: 'Automatic',
                          fuel: 'Diesel',
                          location: 'Miami',
                          isNew: true
                        },
                        {
                          id: 4,
                          title: 'Mercedes C-Class 2020',
                          price: '$38,500',
                          year: '2020',
                          mileage: '18,000 km',
                          transmission: 'Automatic',
                          fuel: 'Petrol',
                          location: 'Chicago',
                          isNew: false
                        }
                      ].map((vehicle) => (
                        <div 
                          key={vehicle.id} 
                          className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                        >
                          <div className="relative h-48 w-full overflow-hidden">
                            <img 
                              src="/mockvehicle.png" 
                              alt={vehicle.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {vehicle.isNew && (
                              <div className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white bg-black rounded">
                                {t.new}
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-grow flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{vehicle.title.split(' ').slice(0, 2).join(' ')}</h3>
                            <span className="text-lg font-bold text-emov-purple mb-2">{vehicle.price}</span>
                            
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <span>{vehicle.title.split(' ').slice(2).join(' ')}</span>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {vehicle.mileage}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{vehicle.location}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Banner 2 - Full Width */}
        <section className="w-full bg-gray-100 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full rounded-xl overflow-hidden">
              <img 
                src="/banner2.png" 
                alt="Special Offers" 
                className="w-full h-auto"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Featured Brands Section */}
        <section className="w-full bg-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Brands</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-8">
              {(() => {
                const allBrands = apiData?.brand || [];
                const uniqueBrands = [];
                const brandNames = new Set();
                
                allBrands.forEach(brand => {
                  if (brand.BrandName && brand.BrandName !== 'Various' && !brandNames.has(brand.BrandName)) {
                    brandNames.add(brand.BrandName);
                    uniqueBrands.push({
                      id: brand.BrandID,
                      name: brand.BrandName,
                      nameUrdu: brand.BrandNameUrdu,
                      nameFrench: brand.BrandNameFrench,
                      image: brand.BrandImage ? `https://api.emov.com.pk/image/${brand.BrandImage}` : null
                    });
                  }
                });

                return uniqueBrands.map((brand) => (
                  <div key={brand.id} className="flex flex-col items-center group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-100 p-2 flex items-center justify-center mb-2">
                      {brand.image ? (
                        <img 
                          src={brand.image} 
                          alt={brand.name}
                          className="h-12 w-auto object-contain bg-gray-100"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-car.png';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <FaCar className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center mt-2">{brand.name}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* Sell Your Vehicle Section with Banner */}
        <section className="w-full bg-gray-100 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full rounded-xl overflow-hidden shadow-sm">
              <img 
                src="/banner3.png" 
                alt="Sell Your Vehicle" 
                className="w-full h-auto"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          </div>
        </section>
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
    </div>
  );
}

export default Dashboard;