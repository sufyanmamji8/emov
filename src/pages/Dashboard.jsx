import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaCar, FaMotorcycle, FaTruck, FaBus, FaShuttleVan, FaSun, FaMoon, FaGlobe, FaChevronLeft, FaChevronRight, FaUser, FaSignOutAlt, FaCaretDown, FaImage, FaCarBattery, FaCrown, FaMoneyBillWave, FaShieldAlt, FaTools, FaCog, FaWater, FaArrowRight } from 'react-icons/fa';
import { FiMapPin, FiCalendar } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';
import apiService, { handleUnauthorized } from '../services/Api';
import Navbar from '../components/Layout/Navbar'; // Import the Navbar component from the correct path

// Gradient image paths from public folder
const gradientLeft = 'gradientleft.png';
// Encode the space in the filename
const gradientRight = 'gradientrightbottom.png';

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
      className={`absolute -left-7 top-1/2 -translate-y-1/2  z-10 w-12 h-12 flex items-center justify-center bg-transparent hover:bg-transparent transition-colors ${!canGoPrev ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={`Previous ${section}`}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-border-primary bg-bg-primary hover:bg-bg-secondary transition-colors">
        <FaChevronLeft className="w-5 h-5 text-[var(--emov-purple)]" />
      </div>
    </button>
    <button
      onClick={onNext}
      disabled={!canGoNext}
      className={`absolute -right-7 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-transparent hover:bg-transparent transition-colors ${!canGoNext ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={`Next ${section}`}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-border-primary bg-bg-primary hover:bg-bg-secondary transition-colors">
        <FaChevronRight className="w-5 h-5 text-[var(--emov-purple)]"/>
      </div>
    </button>
  </>
);

function Dashboard() {
  const navigate = useNavigate();
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
  
  // State for Recently Added vehicles from API
  const [recentlyAddedVehicles, setRecentlyAddedVehicles] = useState([]);
  const [loadingRecentAds, setLoadingRecentAds] = useState(true);
  const [recentAdsError, setRecentAdsError] = useState(null);
  
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
        const maxSlide = Math.ceil((items || []).length / itemsPerRow) - 1;
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
        const maxSlide = Math.ceil((items || []).length / itemsPerRow) - 1;
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
      const maxSlide = Math.ceil((items || []).length / itemsPerRow) - 1;
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
  const handleUnauthorizedAccess = () => {
    handleUnauthorized();
  };

  // Handle token refresh
  const refreshToken = async () => {
    try {
      const response = await apiService.auth.refreshToken();
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return response.token;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, log the user out
      handleLogout();
    }
    return null;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API if available
      await apiService.auth.logout();
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
      const response = await apiService.vehicles.getFilters();
      if (response?.data) {
        console.log('Successfully fetched filter data');
        setApiData(response.data);
        setApiError(null);
        return;
      }
    } catch (err) {
      console.error('Error fetching vehicle filters:', err);
    }
    
    // If all API attempts fail, use fallback data
    console.log('All API attempts failed, using fallback data');
    setApiData(fallbackData);
    setApiError('Using offline data. Some features may be limited.');
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

  // Generate optimized vehicle image paths with lazy loading support
  const generateVehicleImage = (brand, vehicleType, index, brandImage = null) => {
    // Base URL for all images with optimization parameters
    const baseUrl = 'https://api.emov.com.pk/image/';
    const optimizationParams = '?w=400&h=300&fit=cover&q=80&auto=format';
    
    // If we have a brand image, use it with the API URL
    if (brandImage) {
      // Remove any path or URL parts if present
      const cleanImageName = brandImage.split('/').pop();
      // Add optimization parameters
      return `${baseUrl}${cleanImageName}${optimizationParams}`;
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
    
    // Return optimized image URL with parameters
    return `${baseUrl}${vehicleTypeKey}-${imageIndex}.jpg${optimizationParams}`;
  };

  // Fetch filter data and generate vehicles with images
  useEffect(() => {
    const fetchFilterData = async () => {
      try {        
        const token = localStorage.getItem('token');
        if (!token) {
          handleUnauthorizedAccess();
          return;
        }

        const response = await apiService.vehicles.getFilters();
        
        if (response.data) {
          // The API response has the data directly in response.data
          setApiData(response.data);
          const vehicles = generateVehiclesFromFilterData(response.data);
          setVehiclesData(vehicles);
        } else {
          throw new Error('No data received from the server');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          handleUnauthorizedAccess();
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

  // Fetch recent ads for Recently Added section

useEffect(() => {
  const fetchRecentAds = async () => {
    try {
      setLoadingRecentAds(true);
      setRecentAdsError(null);
      console.log('Fetching recent ads...');
      const response = await apiService.ads.getRecentAds();
      
      console.log('Dashboard - Full response:', response);
      console.log('Dashboard - Response data:', response?.data);
      console.log('Dashboard - Data array length:', response?.data?.length);
      
      if (response && response.data && response.data.data) {
        console.log('Transforming data...');
        // Transform the API data to match the expected format
        const transformedData = response.data.data.map(ad => {
          console.log('Processing ad:', ad);
          console.log('Ad images:', ad.Images);
          console.log('First image path:', ad.Images?.[0]);
          
          // ✅ CORRECT: Use /images/ directory instead of /uploads/
          let imageUrl = '/mockvehicle.png';
          if (ad.Images && ad.Images.length > 0) {
            const imageFilename = ad.Images[0];
            
            if (imageFilename.startsWith('http')) {
              imageUrl = imageFilename;
            } else {
              // ✅ CORRECT PATTERN: https://api.emov.com.pk/images/filename.jpg
              imageUrl = `https://api.emov.com.pk/image/${imageFilename}`;
            }
            console.log('Dashboard - Constructed image URL:', imageUrl);
          }
          
          return {
            id: ad.AdID,
            title: ad.VehicleName,
            price: `Rs. ${parseInt(ad.VehiclePrice).toLocaleString()}`,
            year: ad.RegistrationYear,
            mileage: ad.VehicleMileage,
            location: ad.LocationName,
            isNew: true,
            image: imageUrl,
            // Keep original API data for reference
            Images: ad.Images,
            VehicleName: ad.VehicleName,
            VehiclePrice: ad.VehiclePrice,
            RegistrationYear: ad.RegistrationYear,
            VehicleMileage: ad.VehicleMileage,
            LocationName: ad.LocationName,
            SellerComment: ad.SellerComment
          };
        });
        
        console.log('Successfully transformed data:', transformedData);
        setRecentlyAddedVehicles(transformedData);
        console.log('Successfully fetched and transformed recent ads:', transformedData);
      } else {
        console.log('No data in response');
        setRecentAdsError('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching recent ads:', err);
      setRecentAdsError('Failed to load recent ads');
    } finally {
      setLoadingRecentAds(false);
    }
  };

  fetchRecentAds();
}, []);

  // Generate vehicles data from filter API response with optimized image handling
  const generateVehiclesFromFilterData = (filterData) => {
    if (!filterData) return [];
    
    const vehicles = [];
    const brands = Array.isArray(filterData.brand) ? filterData.brand : [];
    const categories = Array.isArray(filterData.category) ? filterData.category : [];
    const models = Array.isArray(filterData.model) ? filterData.model : [];
    const bodyTypes = Array.isArray(filterData.body_type) ? filterData.body_type : [];
    
    // Get up to 12 featured vehicles or all available if less
    const vehicleCount = Math.min(12, Math.max(brands.length, categories.length, models.length) || 6);
    
    // Pre-generate image URLs for better performance
    const imageUrls = Array(vehicleCount).fill().map((_, i) => {
      const brand = brands[i % brands.length] || {};
      const category = categories[i % categories.length] || {};
      const brandName = brand.BrandName || brand.name || 'Vehicle';
      const categoryName = category.CategoryName || category.name || 'Car';
      return generateVehicleImage(brandName, categoryName, i, brand.BrandImage);
    });
    
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
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="border border-red-400 rounded-lg max-w-md p-6 bg-red-500/10 text-red-500">
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
 <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
      {/* Gradient Background Section - Wrapping all three sections */}
       <div className="relative z-10 w-full">
      <div className="relative w-full min-h-[400px] md:min-h-[500px] bg-bg-secondary overflow-hidden">
        {/* Left Gradient - Responsive */}
        {/* Left Gradient - Full Height */}
        <div 
          className="absolute left-0 top-0 w-1/2 sm:w-1/3 md:w-1/3 h-full overflow-hidden"
          style={{
            backgroundImage: `url(/${gradientLeft})`,
            backgroundSize: 'contain',
            backgroundPosition: 'left center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            opacity: 0.8,
            borderTopRightRadius: '9999px',
            borderBottomRightRadius: '9999px',
            clipPath: 'inset(0 0 0 0 round 0 9999px 9999px 0)',
            boxShadow: '8px 0 15px -5px rgba(0, 0, 0, 0.15)',
            transform: 'scaleX(1.2) scaleY(1.1) translateX(-5%)'
          }}
        />
        
        {/* Right Gradient - Bottom of Hero - Maximum Size */}
        <div 
          className="absolute right-0 bottom-0 w-5/6 md:w-2/3 h-4/5"
          style={{
            backgroundImage: `url(/${gradientRight})`,
            backgroundSize: 'contain',
            backgroundPosition: 'right bottom',
            backgroundRepeat: 'no-repeat',
            opacity: 0.8,
            zIndex: 0
          }}
        />
        
        {/* Wrapper for all three sections */}
       
          {/* Top Header Section */}
          <div className="bg-bg-secondary/90 py-0 px-0 sm:px-0 lg:px-0">
            <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-8 sm:h-10 py-6 border-b border-border-primary">
            <div className="flex items-center space-x-2 ">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--emov-green, #00FFA9)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-text-primary">Download App</span>
            </div>

               {/* Right side controls */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      {/* Desktop Language Selector and Theme Toggle */}
                      <div className="hidden md:flex items-center space-x-4">
                        {/* Language Selector */}
                        <div className="relative">
                          <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent text-text-primary pr-6 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-0 border-0 transition-all duration-200 appearance-none"
                          >
                            <option value="english">English</option>
                            <option value="urdu">Urdu</option>
                            <option value="french">French</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                            <FaCaretDown className="text-text-secondary w-3 h-3" />
                          </div>
                        </div>
                        
                        {/* Theme Toggle Button */}
                        <button 
                          onClick={toggleTheme}
                          className="focus:outline-none p-2 sm:p-2.5 transition-all duration-200 hover:scale-105 rounded-xl text-text-primary hover:bg-bg-tertiary"
                          style={{ borderRadius: '12px' }}
                          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                          {isDark ? <FaSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors border-none">
                <span>Sign In</span>
              </button>
              <button className="flex items-center space-x-1 text-text-primary px-4 py-1 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--emov-green, #27c583ff)',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>Sign Up</span>
              </button>
              
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
        <section className="relative w-full overflow-hidden pb-12 sm:pb-16 ">
          <div className="relative max-w-[2000px] mx-auto">
              {/* Content */}
              {/* Hero Text */}
              <div className="text-left mt-8 md:mt-5 px-4 sm:px-6 lg:px-8 mb-8 sm:mb-10">
                <div className="ml-0 md:ml-16 max-w-4xl">
                  <h1 className="text-text-primary ml-16 mt-12 font-semibold text-base sm:text-2xl md:text-5xl font-normal mb-1 sm:mb-3 leading-tight whitespace-nowrap">
                    {t.findVehicles}
                  </h1>
                  <h1 className="text-lg ml-16 sm:text-3xl md:text-6xl font-normal mb-2 sm:mb-4 leading-tight text-text-tertiary whitespace-nowrap">
                    {t.tagline}
                  </h1>
                </div>
              </div>

              {/* Search Bar */}
              <div className="w-full px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none z-10">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6 text-text-tertiary" 
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
                    className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 bg-bg-secondary/30 backdrop-blur-lg border-2 border-border-primary/40 focus:border-border-primary/70 focus:ring-2 focus:ring-border-primary/30 text-sm sm:text-base placeholder-text-tertiary text-text-primary"
                    style={{
                      borderRadius: '12px',
                      transition: 'all 0.3s ease-in-out',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)'
                    }}
                    placeholder={t.searchPlaceholder}
                  />
                  <button className="absolute inset-y-0 right-0 pr-4 sm:pr-5 flex items-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                </div>
            </div>
          
        </div>
        
       
      </section>
      
       
        </div>
        </div>
         </div>
         
       
      
      {/* Banner Section */}
      <section className="w-full bg-bg-primary py-0 sm:py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full rounded-xl overflow-hidden ">
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
   <section className="w-full bg-bg-secondary py-12 sm:py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="w-full bg-transparent rounded-xl overflow-hidden">
      <div className="w-full p-6 bg-bg-secondary rounded-t-lg">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-text-primary">{t.browseUsedVehicles}</h2>
        
        {/* Tabs - MOBILE: Show all 5 tabs in grid, DESKTOP: original */}
        <div className="w-full pb-1">
          {/* Mobile: Single line tabs */}
          <div className="md:hidden flex space-x-1 overflow-x-auto pb-1 no-scrollbar">
            {['Category', 'Budget', 'Brand', 'Model', 'Body Type'].map((tab) => (
              <button
                key={tab}
                className={`px-2 py-2 text-[10px] xs:text-xs font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-emov-purple border-b-2 border-emov-purple'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          
          {/* Desktop: Original tab layout */}
          <div className="hidden md:block overflow-x-auto pb-1">
            <div style={{ fontSize: '20px' }} className="flex space-x-1 border-b border-border-primary w-max min-w-full">
              {['Category', 'Budget', 'Brand', 'Model', 'Body Type'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-sm sm:text-base font-medium whitespace-nowrap relative ${
                    activeTab === tab
                      ? 'text-emov-purple after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emov-purple'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="relative w-full pb-6 px-6 bg-bg-secondary rounded-lg">
        <div className="relative w-full overflow-hidden">
          {/* Arrows - ORIGINAL POSITION */}
          <button
            onClick={() => scrollLeft(activeTab)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-bg-primary rounded-full border-2 border-border-secondary text-text-primary hover:bg-bg-tertiary transition-colors ${
              !canScrollLeft(activeTab) ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            style={{ padding: '0.5rem' }}
            disabled={!canScrollLeft(activeTab)}
          >
            <FaChevronRight style={{ color: '#7B3DFF'}} className="w-3 h-3 sm:w-5 sm:h-5 transform rotate-180" />
          </button>

          <button
            onClick={() => scrollRight(activeTab)}
            className={`absolute right-0 md:right-5 top-1/2 -translate-y-1/2 z-10 bg-bg-primary rounded-full border-2 border-border-secondary text-text-primary hover:bg-bg-tertiary transition-colors ${
              !canScrollRight(activeTab) ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            style={{ padding: '0.5rem' }}
            disabled={!canScrollRight(activeTab)}
          >
            <FaChevronRight style={{ color: '#7B3DFF' }} className="w-3 h-3 sm:w-5 sm:h-5" />
          </button>

          {/* Carousel Track */}
          <div 
            ref={slideRef}
            className="flex transition-transform duration-300 ease-in-out w-full"
            style={{ transform: `translateX(-${currentSlides[activeTab] * 100}%)` }}
          >
            {(() => {
              const transformedData = transformApiData();
              let currentTabData = [];
              
              const tabDataMap = {
                'Category': 'categories',
                'Model': 'models',
                'Brand': 'brands',
                'Body Type': 'bodytypes',
                'Budget': 'budgets'
              };
              
              const normalizedTab = activeTab.replace(/\s+/g, ' ');
              let dataKey = tabDataMap[normalizedTab];
              
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

              // MOBILE: 8 items per slide (4 columns × 2 rows), DESKTOP: original
              const itemsPerSlideMobile = 8;
              const totalSlides = Math.ceil(currentTabData.length / 
                (window.innerWidth < 768 ? itemsPerSlideMobile : itemsPerPage));
              
              const slides = [];

              for (let i = 0; i < totalSlides; i++) {
                const slideItems = currentTabData.slice(
                  i * (window.innerWidth < 768 ? itemsPerSlideMobile : itemsPerPage), 
                  (i + 1) * (window.innerWidth < 768 ? itemsPerSlideMobile : itemsPerPage)
                );

                slides.push(
                  <div key={`slide-${i}`} className="flex-shrink-0 w-full" style={{ width: '100%' }}>
                    {/* MOBILE: 4 columns × 2 rows, DESKTOP: original grid */}
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:sm:grid-cols-3 lg:grid-cols-5 md:gap-4 w-full px-2 sm:px-4">
                      {slideItems.map((item, index) => {
                        const displayName = item.displayName || item.name || item.CategoryName || 'Unnamed Category';
                        const itemCount = typeof item.count === 'number' ? item.count : 0;
                        
                        // MOBILE card layout
                        const mobileCard = () => (
                          <div className="relative flex flex-col items-center p-1 h-full w-full">
                            {item.image || item.icon ? (
                              <div className="relative w-full flex justify-center" style={{ height: '30px' }}>
                                {item.icon ? (
                                  <div className="flex items-center justify-center bg-bg-primary rounded-full w-5 h-5 border border-border-primary">
                                    {React.cloneElement(item.icon, { 
                                      size: 10,
                                      style: { 
                                        color: 'var(--text-secondary)' 
                                      }
                                    })}
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
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
                                  </div>
                                )}
                              </div>
                            ) : null}
                            <div className="text-center w-full mt-0.5">
                              <div className="text-[10px] xs:text-xs font-medium text-text-primary line-clamp-2 leading-tight">
                                {displayName}
                              </div>
                            </div>
                          </div>
                        );

                        // DESKTOP card layout (original)
                        const desktopCard = () => (
                          <div className="relative flex flex-col items-center p-3 h-full w-full">
                            {item.image || item.icon ? (
                              <div className="relative w-full" style={{ height: '71px' }}>
                                {item.icon ? (
                                  <div 
                                    className="flex items-center justify-center bg-bg-primary rounded-full"
                                    style={{
                                      position: 'absolute',
                                      left: '-20px',
                                      top: '-10px',
                                      width: '40px',
                                      height: '40px',
                                      zIndex: 20,
                                      border: '1px solid #e9f0feff'
                                    }}
                                  >
                                    {React.cloneElement(item.icon, { size: 20, style: { color: '#878787' } })}
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center p-2">
                                    <img 
                                      src={item.image} 
                                      alt={displayName}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : null}
                            <div className="text-center w-full">
                              <div className="text-base mt-4 font-medium text-text-primary line-clamp-2">
                                {displayName}
                              </div>
                            </div>
                          </div>
                        );

                        return (
                          <div 
                            key={`${item.id || index}-${activeTab}`}
                            className={`relative flex flex-col rounded-lg cursor-pointer ${
                              isDark 
                                ? 'bg-bg-card border border-border-primary' 
                                : 'bg-bg-primary border border-border-primary'
                            }`}
                            style={{
                              width: window.innerWidth < 768 ? '100%' : '180px',
                              height: window.innerWidth < 768 ? '70px' : '158px',
                            }}
                          >
                            {window.innerWidth < 768 ? mobileCard() : desktopCard()}
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
  </div>
</section>

        {/* Other Services Section */}
        <section className="w-full bg-bg-primary py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2  style={{ fontSize: '24px' }} className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">{t.otherServices}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {otherServices.map((service, index) => (
                <div 
                  key={index}
                  className="overflow-hidden rounded-lg border border-border-primary p-4 sm:p-5 text-center cursor-pointer bg-bg-secondary hover:border-border-secondary transition-colors"
                >
                  <div className="text-2xl sm:text-3xl mb-3 text-emov-purple">{service.icon}</div>
                  <span className="text-sm sm:text-base font-medium text-text-primary">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recently Added Section */}

{/* Recently Added Section */}
<section className="w-full bg-bg-secondary py-12 sm:py-16 relative">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-text-primary">{t.recentlyAdded}</h2>
    </div>
    
    {loadingRecentAds ? (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emov-purple mx-auto"></div>
        <p className="mt-2 text-text-secondary">Loading vehicles...</p>
      </div>
    ) : recentAdsError ? (
      <div className="text-center py-10 text-red-500">
        <p>{recentAdsError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-emov-purple text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Retry
        </button>
      </div>
    ) : recentlyAddedVehicles.length > 0 ? (
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
              {recentlyAddedVehicles.slice(groupIndex * 4, (groupIndex + 1) * 4).map((vehicle, vehicleIndex) => {
                // Use the image URL that was already constructed in fetchRecentAds
                const vehicleImageUrl = vehicle.image || '/mockvehicle.png';
                
                return (
                  <div 
                    key={`${vehicle.AdID || vehicle.id}-${vehicleIndex}`} 
                    className="group bg-bg-primary rounded-lg overflow-hidden flex flex-col h-full transition-shadow duration-300 hover:shadow-lg cursor-pointer"
                    onClick={() => navigate(`/ad/${vehicle.AdID || vehicle.id}`, { state: { adData: vehicle } })}
                  >
                    {/* Image with minimal gap like reference */}
                    <div className="p-3">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-bg-secondary border border-border-primary rounded-lg m-0.5"></div>
                        <img 
                          src={vehicleImageUrl} 
                          alt={vehicle.VehicleName || vehicle.title}
                          className="relative z-10 w-full h-full object-cover rounded-md transition-transform duration-500 group-hover:scale-105 bg-bg-primary"
                          style={{
                            border: '1px solid var(--border-primary)',
                            boxSizing: 'border-box'
                          }}
                          loading="lazy"
                          onError={(e) => {
                            console.log('❌ Image failed to load:', vehicleImageUrl);
                            e.target.onerror = null;
                            e.target.src = '/mockvehicle.png';
                          }}
                          onLoad={(e) => {
                            console.log('✅ Image loaded successfully:', vehicleImageUrl);
                          }}
                        />
                        {vehicle.isNew && (
                          <div className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded">
                            {t.new}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Content area */}
                    <div className="px-3 pb-3 flex-grow flex flex-col">
                      {/* Vehicle Title */}
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1 leading-tight line-clamp-1">
                        {(vehicle.VehicleName || vehicle.title || '').split(' ').slice(0, 3).join(' ')}
                      </h3>
                      
                      {/* Vehicle Description */}
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0 leading-tight line-clamp-1">
                        {(vehicle.VehicleName || vehicle.title || '').split(' ').slice(3).join(' ') || vehicle.SellerComment || ''}
                      </p>
                      
                      {/* Price */}
                      <span className="text-base sm:text-lg font-bold text-emov-purple mb-1 sm:mb-2 block">
                        {vehicle.VehiclePrice ? `Rs ${parseInt(vehicle.VehiclePrice).toLocaleString()}` : vehicle.price}
                      </span>
                      
                      {/* Details row - Year and Mileage */}
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-1">
                        <span>{vehicle.RegistrationYear || vehicle.year || '2020'}</span>
                        <span className="mx-1 sm:mx-2">|</span>
                        <span className="line-clamp-1">{vehicle.VehicleMileage || vehicle.mileage}</span>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-auto">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-1">{vehicle.LocationName || vehicle.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
    ) : (
      <div className="text-center py-10 text-text-secondary">
        <p>No recent vehicles available</p>
      </div>
    )}
  </div>
</section>

        {/* Featured Vehicles Section */}
     <section className="w-full bg-bg-primary py-12 sm:py-16 relative">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-text-primary">{t.featuredVehicles}</h2>
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
                  className="group bg-bg-secondary rounded-lg overflow-hidden flex flex-col h-full transition-shadow duration-300 hover:shadow-lg"
                >
                  {/* Image with minimal gap like reference */}
                  <div className="p-3">
                    <div className="relative h-48 w-full rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-bg-secondary border border-border-primary rounded-lg m-0.5"></div>
                      <img 
                        src="/mockvehicle.png" 
                        alt={vehicle.title}
                        className="relative z-10 w-full h-full object-cover rounded-md transition-transform duration-500 group-hover:scale-105 bg-bg-primary"
                        style={{
                          border: '1px solid var(--border-primary)',
                          boxSizing: 'border-box'
                        }}
                        loading="lazy"
                      />
                      {vehicle.isNew && (
                        <div className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded">
                          {t.new}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content area - exactly like reference image */}
                  <div className="px-3 pb-3 flex-grow flex flex-col">
                    {/* Vehicle Title - Two lines */}
                    <h3 className="text-base font-semibold text-text-primary mb-1 leading-tight">
                      {vehicle.title.split(' ').slice(0, 2).join(' ')}
                    </h3>
                    
                    {/* Vehicle Description - Second line */}
                    <p className="text-sm text-gray-600 mb-1 leading-tight">
                      {vehicle.title.split(' ').slice(2).join(' ')}
                    </p>
                    
                    {/* Price - Large and prominent */}
                    <span className="text-lg font-bold text-emov-purple mb-2">{vehicle.price}</span>
                    
                    {/* Details row - Year and Mileage */}
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <span>{vehicle.year}</span>
                      <span className="mx-2">|</span>
                      <span>{vehicle.mileage}</span>
                    </div>
                    
                    {/* Location with icon */}
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <section className="w-full bg-bg-primary py-6 sm:py-8">
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
        <section className="w-full bg-bg-secondary py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Featured Brands</h2>
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
                    <div className="w-24 h-24 rounded-full bg-bg-primary border-2 border-border-primary p-2 flex items-center justify-center mb-2">
                      {brand.image ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <img 
                            src={brand.image} 
                            alt={brand.name}
                            className="h-12 w-auto object-contain"
                            style={{
                              maxWidth: '80%',
                              maxHeight: '80%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-car.png';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full flex items-center justify-center">
                          <FaCar className="text-text-tertiary" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-text-primary text-center mt-2">{brand.name}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* Sell Your Vehicle Section with Banner */}
        <section className="w-full bg-bg-primary py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full rounded-xl overflow-hidden">
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
          {/* Close the Content Wrapper */}
         {/* Close the Gradient Background Section */}
      {/* Close the min-h-screen container */}

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