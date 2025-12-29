import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaCar, FaMotorcycle, FaTruck, FaBus, FaShuttleVan, FaSun, FaMoon, FaGlobe, FaChevronLeft, FaChevronRight, FaUser, FaSignOutAlt, FaCaretDown, FaImage, FaCarBattery, FaCrown, FaMoneyBillWave, FaShieldAlt, FaTools, FaCog, FaWater, FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa';
import { FiMapPin, FiCalendar } from 'react-icons/fi';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import apiService, { handleUnauthorized, api } from '../services/Api';
import Navbar from '../components/Layout/Navbar'; // Import Navbar component from correct path
import MobileBottomNav from '../components/Layout/MobileBottomNav';
import Header from '../components/Layout/Header'; // Import Header component for consistency
import More from './More'; // Import More component
import { useFilterNavigation } from '../hooks/useFilterNavigation';

// Dashboard state persistence with localStorage
const DASHBOARD_CACHE_KEY = 'emov_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getDashboardCache = () => {
  // COMPLETELY DISABLE DASHBOARD CACHE - Force fresh API calls
    return null;
};

const setDashboardCache = (data) => {
  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save dashboard cache:', error);
  }
};

// Add this component BEFORE your main Dashboard component
const SearchResultItem = ({ ad, isDark, handleAdClick}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  
  return (
    <button
      onClick={() => handleAdClick(ad)}
      className={`w-full text-left p-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative w-12 h-12">
          {imageLoading && (
            <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg`}>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-emov-purple"></div>
            </div>
          )}
          <img
            src={ad.Images?.[0] ? `https://api.emov.com.pk/image/${ad.Images[0]}` : '/mockvehicle.png'}
            alt={ad.VehicleName}
            className={`w-12 h-12 object-cover rounded-lg ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              e.target.src = '/mockvehicle.png';
              setImageLoading(false);
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} truncate`}>
            {ad.VehicleName}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
            {ad.BrandName} {ad.ModelName} • {ad.VehicleType}
          </p>
          <p className="text-xs text-emov-purple font-semibold">
            {ad.VehiclePrice ? `Rs ${parseFloat(ad.VehiclePrice).toLocaleString()}` : t.priceNotAvailable}
          </p>
        </div>
      </div>
    </button>
  );
};

// Gradient image paths from public folder
const gradientLeft = 'gradientleft.png';
// Encode the space in the filename
const gradientRight = 'gradientrightbottom.png';


// Color constants
const colors = {
  green: '#10B981', // emerald-500
  purple: '#7A288A', // violet-500
  blue: '#2196F3',  // blue-500
  red: '#EF4444'    // red-500
};

// Debug: Log image paths and check if they're accessible



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







function Dashboard({ handleLogout: appLogout }) {
      const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { navigateToFilteredAds } = useFilterNavigation(); 

      // Ensure navigateToFilteredAds exists; provide safe fallback
      const safeNavigateToFilteredAds = (tab, item) => {
        if (typeof navigateToFilteredAds === 'function') {
          try {
            navigateToFilteredAds(tab, item);
            return;
          } catch (e) {
            console.error('navigateToFilteredAds failed:', e);
          }
        }
        // Fallback: navigate to /ads with simple query params
        const params = new URLSearchParams();
        if (tab) params.set('filter', tab);
        if (item) {
          if (item.id) params.set('id', item.id);
          else if (item.CategoryName) params.set('q', item.CategoryName);
          else if (item.name) params.set('q', item.name);
        }
        navigate(`/ads?${params.toString()}`);
      }; 

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'Category';
    try {
      return localStorage.getItem('dashboardActiveTab') || 'Category';
    } catch {
      return 'Category';
    }
  });
  const [scrollPositions, setScrollPositions] = useState({
    Category: 0,
    Budget: 0,
    Brand: 0,
    Model: 0,
    BodyType: 0
  });
  const [apiData, setApiData] = useState(null); // Force null to always call API
  const [vehiclesData, setVehiclesData] = useState(() => {
    const cachedData = getDashboardCache();
    return cachedData?.vehiclesData || [];
  });
  const [error, setError] = useState(() => {
    const cachedData = getDashboardCache();
    return cachedData?.error || null;
  });
  const [userProfile, setUserProfile] = useState(() => {
    // Initialize with data from localStorage if available
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const profile = JSON.parse(userData);
        
        // Handle profile picture URL construction
        if (profile.picture) {
          // If picture is already a full URL, use it as-is
          if (!profile.picture.startsWith('http')) {
            profile.picture = `https://api.emov.com.pk/image/${profile.picture.replace(/^\/+/, '')}`;
          }
        } else if (profile.imageUrl) {
          // Fallback to imageUrl if picture doesn't exist
          if (!profile.imageUrl.startsWith('http')) {
            profile.picture = `https://api.emov.com.pk/image/${profile.imageUrl.replace(/^\/+/, '')}`;
          } else {
            profile.picture = profile.imageUrl;
          }
        } else if (profile.UserProfile) {
          // Fallback to UserProfile if neither picture nor imageUrl exist
          if (!profile.UserProfile.startsWith('http')) {
            profile.picture = `https://api.emov.com.pk/image/${profile.UserProfile.replace(/^\/+/, '')}`;
          } else {
            profile.picture = profile.UserProfile;
          }
        }
        
        return profile;
      }
    } catch (e) {
      console.error('Error initializing user profile:', e);
    }
    return null;
  });

  // Listen for localStorage changes to sync profile picture updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const userData = e.newValue ? JSON.parse(e.newValue) : null;
          if (userData) {
            // Apply the same URL construction logic
            if (userData.picture) {
              if (!userData.picture.startsWith('http')) {
                userData.picture = `https://api.emov.com.pk/image/${userData.picture.replace(/^\/+/, '')}`;
              }
            } else if (userData.imageUrl) {
              if (!userData.imageUrl.startsWith('http')) {
                userData.picture = `https://api.emov.com.pk/image/${userData.imageUrl.replace(/^\/+/, '')}`;
              } else {
                userData.picture = userData.imageUrl;
              }
            } else if (userData.UserProfile) {
              if (!userData.UserProfile.startsWith('http')) {
                userData.picture = `https://api.emov.com.pk/image/${userData.UserProfile.replace(/^\/+/, '')}`;
              } else {
                userData.picture = userData.UserProfile;
              }
            }
            
            setUserProfile(userData);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    // Listen for custom profile update events
    const handleProfileUpdate = (e) => {
      const updatedUser = e.detail;
      if (updatedUser) {
        setUserProfile(updatedUser);
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events (from same tab profile updates)
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    // Also check for direct localStorage updates (same tab)
    const checkLocalStorage = () => {
      try {
        const userData = localStorage.getItem('user');
        const currentProfile = JSON.stringify(userProfile);
        if (userData !== currentProfile) {
          const parsedUserData = userData ? JSON.parse(userData) : null;
          if (parsedUserData) {
            // Apply the same URL construction logic
            if (parsedUserData.picture) {
              if (!parsedUserData.picture.startsWith('http')) {
                parsedUserData.picture = `https://api.emov.com.pk/image/${parsedUserData.picture.replace(/^\/+/, '')}`;
              }
            } else if (parsedUserData.imageUrl) {
              if (!parsedUserData.imageUrl.startsWith('http')) {
                parsedUserData.picture = `https://api.emov.com.pk/image/${parsedUserData.imageUrl.replace(/^\/+/, '')}`;
              } else {
                parsedUserData.picture = parsedUserData.imageUrl;
              }
            } else if (parsedUserData.UserProfile) {
              if (!parsedUserData.UserProfile.startsWith('http')) {
                parsedUserData.picture = `https://api.emov.com.pk/image/${parsedUserData.UserProfile.replace(/^\/+/, '')}`;
              } else {
                parsedUserData.picture = parsedUserData.UserProfile;
              }
            }
            
            setUserProfile(parsedUserData);
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    };

    // Set up periodic check for same-tab updates
    const intervalId = setInterval(checkLocalStorage, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      clearInterval(intervalId);
    };
  }, [userProfile]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Mobile bottom nav visibility state
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Image loading states for search results
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  
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

  // Handle tab changes for the browse section
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('dashboardActiveTab', tab);
    } catch {
      // ignore storage errors
    }
    // Reset the slide index for the newly selected tab
    setCurrentSlides((prev) => ({
      ...prev,
      [tab]: 0,
    }));
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Call the logout function passed from App.jsx
      if (typeof appLogout === 'function') {
        appLogout();
      } else {
        // Fallback: Clear auth data and navigate
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        setUserProfile(null);
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to home even if there's an error
      navigate('/', { replace: true });
    }
  };

  // State for Recently Added vehicles from API
  const [recentlyAddedVehicles, setRecentlyAddedVehicles] = useState(() => {
    const cachedData = getDashboardCache();
    return cachedData?.recentlyAddedVehicles || [];
  });
  const [loadingRecentAds, setLoadingRecentAds] = useState(() => {
    const cachedData = getDashboardCache();
    return cachedData?.recentlyAddedVehicles ? false : true;
  });
  const [recentAdsError, setRecentAdsError] = useState(() => {
    const cachedData = getDashboardCache();
    return cachedData?.recentAdsError || null;
  });
  
  // Separate responsive logic for Recently Added and Featured Vehicles
  const [carouselItemsPerRow, setCarouselItemsPerRow] = useState(4);
  
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

  // Update carousel items per row for Recently Added and Featured Vehicles
  useEffect(() => {
    const updateCarouselItemsPerRow = () => {
      if (window.innerWidth < 640) { // Mobile - show 1 item at a time
        setCarouselItemsPerRow(1);
      } else if (window.innerWidth < 768) { // Small screens
        setCarouselItemsPerRow(2);
      } else if (window.innerWidth < 1024) { // Medium screens
        setCarouselItemsPerRow(3);
      } else { // Large screens
        setCarouselItemsPerRow(4);
      }
    };
    
    // Set initial value
    updateCarouselItemsPerRow();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateCarouselItemsPerRow);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateCarouselItemsPerRow);
  }, []);
  const slideRef = useRef(null);

  // Search functions
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = async (query) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Show search results immediately if there's a query
    if (query.trim()) {
      setShowSearchResults(true);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        // Search in all ads data
        const allAds = [...recentlyAddedVehicles];
        console.log('Searching through ads:', allAds.length, 'ads available');
        console.log('Sample ad data:', allAds[0]);
        
        const filtered = allAds.filter(ad => {
          const searchLower = query.toLowerCase();
          // Search by category (VehicleType), model name (VehicleName), and seller's comment
          // Use actual field names from the API response
          return (
            (ad.VehicleType && ad.VehicleType.toLowerCase().includes(searchLower)) ||
            (ad.VehicleName && ad.VehicleName.toLowerCase().includes(searchLower)) ||
            (ad.Description && ad.Description.toLowerCase().includes(searchLower)) ||
            (ad.BrandName && ad.BrandName.toLowerCase().includes(searchLower)) ||
            (ad.ModelName && ad.ModelName.toLowerCase().includes(searchLower)) ||
            (ad.BrandID && ad.BrandID.toString().includes(searchLower)) ||
            (ad.ModelID && ad.ModelID.toString().includes(searchLower)) ||
            (ad.VehicleTypeID && ad.VehicleTypeID.toString().includes(searchLower)) ||
            (ad.BodyTypeID && ad.BodyTypeID.toString().includes(searchLower))
          );
        });

        console.log('Search results:', filtered.length, 'items found');
        setSearchResults(filtered);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce delay

    setSearchTimeout(timeout);
  };

  const addToRecentSearches = (query) => {
    if (!query.trim()) return;
    
    const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newSearches);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    } catch {
      // ignore storage errors
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
    } catch {
      // ignore storage errors
    }
  };

  const handleSearchSubmit = (query) => {
    addToRecentSearches(query);
    handleSearch(query);
  };

  const handleAdClick = async (ad) => {
    const adId = ad.AdID || ad.id || ad.adId || ad._id;
    console.log('Clicked ad:', ad);
    console.log('Ad ID:', adId);
    
    if (adId) {
      // Navigate directly with existing ad data - no API calls needed
      console.log('Navigating with ad data:', ad);
      navigate(`/ad/${adId}`, { state: { adData: ad } });
    } else {
      console.log('No Ad ID found in ad data:', ad);
    }
    setShowSearchResults(false);
  };

  // Image loading helper functions
  const setImageLoading = (adId, isLoading) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [adId]: isLoading
    }));
  };

  const isImageLoading = (adId) => {
    return imageLoadingStates[adId] !== false;
  };

  // Mobile bottom nav scroll detection - Dashboard specific
  useEffect(() => {
    let isMounted = true;
    
    const handleScroll = () => {
      if (!isMounted) return;
      
      const currentScrollY = window.scrollY;
      
      // Hide bottom nav when scrolling down, show when scrolling up
      // Only apply this behavior on dashboard page
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setIsBottomNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsBottomNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Add click outside handler for search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup search timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [showSearchResults, searchTimeout]);

  // Update scrollLeft and scrollRight to work with carousel
  const scrollLeft = (tab, items = null, itemsPerRow = 4) => {
    setCurrentSlides(prevSlides => {
      if (tab === 'Recently Added' || tab === 'Featured Vehicles') {
        const maxSlide = Math.ceil((items || []).length / itemsPerRow) - 1;
        const newSlide = Math.max(prevSlides[tab] - 1, 0);
        return { ...prevSlides, [tab]: newSlide };
      } else {
        const transformedData = transformApiData();
        
        // Use the same tabDataMap logic as in the carousel
        const tabDataMap = {
          'Category': 'categories',
          'Model': 'models',
          'Brand': 'brands',
          'Body Type': 'bodytypes',
          'Budget': 'budgets'
        };
        
        const normalizedTab = tab.replace(/\s+/g, ' ');
        let dataKey = tabDataMap[normalizedTab];
        
        if (!dataKey) {
          const lowerTab = normalizedTab.toLowerCase().replace(/\s+/g, '');
          dataKey = Object.entries(tabDataMap).find(([key]) => 
            key.toLowerCase().replace(/\s+/g, '') === lowerTab
          )?.[1];
        }
        
        const currentTabData = Array.isArray(transformedData[dataKey]) ? 
          transformedData[dataKey] : [];
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
        
        // Use the same tabDataMap logic as in the carousel
        const tabDataMap = {
          'Category': 'categories',
          'Model': 'models',
          'Brand': 'brands',
          'Body Type': 'bodytypes',
          'Budget': 'budgets'
        };
        
        const normalizedTab = tab.replace(/\s+/g, ' ');
        let dataKey = tabDataMap[normalizedTab];
        
        if (!dataKey) {
          const lowerTab = normalizedTab.toLowerCase().replace(/\s+/g, '');
          dataKey = Object.entries(tabDataMap).find(([key]) => 
            key.toLowerCase().replace(/\s+/g, '') === lowerTab
          )?.[1];
        }
        
        const currentTabData = Array.isArray(transformedData[dataKey]) ? 
          transformedData[dataKey] : [];
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
      
      // Use the same tabDataMap logic as in the carousel
      const tabDataMap = {
        'Category': 'categories',
        'Model': 'models',
        'Brand': 'brands',
        'Body Type': 'bodytypes',
        'Budget': 'budgets'
      };
      
      const normalizedTab = tab.replace(/\s+/g, ' ');
      let dataKey = tabDataMap[normalizedTab];
      
      if (!dataKey) {
        const lowerTab = normalizedTab.toLowerCase().replace(/\s+/g, '');
        dataKey = Object.entries(tabDataMap).find(([key]) => 
          key.toLowerCase().replace(/\s+/g, '') === lowerTab
        )?.[1];
      }
      
      const currentTabData = Array.isArray(transformedData[dataKey]) ? 
        transformedData[dataKey] : [];
      const maxSlide = Math.ceil(currentTabData.length / itemsPerPage) - 1;
      return currentSlides[tab] < maxSlide;
    }
  };

  const [apiError, setApiError] = useState(null);

  // Fallback data for when API is not available
  const fallbackData = {
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
    // ALWAYS CALL API - Remove data existence check
    console.log('[Dashboard] Forcing API call for vehicle filters');
    
    try {
      
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
  }, []); // Remove apiData dependency

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

  // Single API call for filter data
  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Fetch recent ads for Recently Added section
  useEffect(() => {
    const fetchRecentAds = async () => {
      // Check if we have valid cached data for recent ads
      const cachedData = getDashboardCache();
      if (cachedData && cachedData.recentlyAddedVehicles) {
        setRecentlyAddedVehicles(cachedData.recentlyAddedVehicles);
        setLoadingRecentAds(false);
        setRecentAdsError(null);
        return;
      }

      try {
        setLoadingRecentAds(true);
        setRecentAdsError(null);
        
        const response = await apiService.ads.getRecentAds();
        
        if (response && response.data && response.data.data) {
          // Transform the API data to match the expected format
          const transformedData = response.data.data.map(ad => {
            // CORRECT: Use /images/ directory instead of /uploads/
            let imageUrl = '/mockvehicle.png';
            if (ad.Images && ad.Images.length > 0) {
              const imageFilename = ad.Images[0];
              
              if (imageFilename.startsWith('http')) {
                imageUrl = imageFilename;
              } else {
                // CORRECT PATTERN: https://api.emov.com.pk/images/filename.jpg
                imageUrl = `https://api.emov.com.pk/image/${imageFilename}`;
              }
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
              Images: ad.Images,
              VehicleType: ad.VehicleType,
              VehiclePrice: ad.VehiclePrice,
              RegistrationYear: ad.RegistrationYear,
              VehicleMileage: ad.VehicleMileage,
              LocationName: ad.LocationName,
              EngineType: ad.EngineType,
              Transmission: ad.Transmission,
              Color: ad.Color,
              VehiclePower: ad.VehiclePower,
              LoadCapacity: ad.LoadCapacity,
              Ownership: ad.Ownership,
              // Additional fields from API
              BodyTypeName: ad.BodyTypeName,
              BrandName: ad.BrandName,
              ModelName: ad.ModelName,
              VehicleTypeID: ad.VehicleTypeID,
              VehicleBrandID: ad.VehicleBrandID,
              VehicleModelID: ad.VehicleModelID,
              // Seller information (forwarded so AdDetail can display it)
              sellerName: ad.sellerName,
              emailAddress: ad.emailAddress,
              mobileNo: ad.mobileNo,
              UserProfile: ad.UserProfile,
              // Also provide alternative field names that AdDetail expects
              SellerName: ad.sellerName,
              SellerEmail: ad.emailAddress,
              SellerPhone: ad.mobileNo,
              SellerImage: ad.UserProfile,
            };
          });
          
          setRecentlyAddedVehicles(transformedData);
          
          // Update cache with recent ads data
          const currentCache = getDashboardCache() || {};
          setDashboardCache({
            ...currentCache,
            recentlyAddedVehicles: transformedData
          });
        } else {
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
      
      budgets: (apiData.budget || []).map((item, index) => {
        const minVal =
          item.MinAmount ??
          item.min ??
          item.minAmount ??
          null;
        const maxVal =
          item.MaxAmount ??
          item.max ??
          item.maxAmount ??
          null;

        return {
          id: item.BudgetID || `budget-${index + 1}`,
          name: getLocalizedName(item, 'budget'),
          // Expose both camelCase and original-style keys for compatibility
          min: minVal,
          max: maxVal,
          MinAmount: minVal,
          MaxAmount: maxVal,
          count: Math.floor(Math.random() * 80) + 10,
          color: colorsList[(index + 2) % colorsList.length],
          displayName: getLocalizedName(item, 'budget'),
          originalData: item,
          type: 'budget'
        };
      }),
      
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
      myAds: "My Ads",
      manageAds: "Manage your posted vehicle listings",
      noAdsYet: "No ads yet",
      startSelling: "Start selling your vehicle by creating your first ad today.",
      createFirstAd: "Create Your First Ad",
      createNewAd: "Create New Ad",
      loadingAds: "Loading your ads...",
      tryAgain: "Try Again",
      confirmDeletion: "Confirm Deletion",
      deleteAdMessage: "Are you sure you want to delete this ad? This action cannot be undone.",
      deleteAd: "Delete Ad",
      cancel: "Cancel",
      previous: "Previous",
      next: "Next",
      searching: "Searching...",
      noVehiclesFound: "No vehicles found",
      tryAdjustingSearch: "Try adjusting your search terms",
      foundResults: "Found {count} result{count !== 1 ? 's' : ''}",
      recentSearches: "Recent Searches",
      clear: "Clear",
      priceNotAvailable: "Price not available",
      myProfile: "My Profile",
      settings: "Settings",
      theme: "Theme",
      language: "Language",
      signOut: "Sign out",
      more: "More",
      dashboard: "Dashboard",
      noEmail: "No email",
      // Footer translations
      findYourNextVehicle: "Find your next vehicle with confidence",
      company: "Company",
      support: "Support", 
      legal: "Legal",
      aboutUs: "About Us",
      careers: "Careers",
      blog: "Blog",
      allRightsReserved: "© {year} Emov. All rights reserved.",
      facebook: "Facebook",
      twitter: "Twitter",
      instagram: "Instagram",
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
      myAds: "میرے اشتہار",
      manageAds: "اپنے پوسٹ شدہ گاڑیوں کی فہرست کریں",
      noAdsYet: "ابھی تک کوئی اشتہار نہیں",
      startSelling: "آج اپنی پہلی گاڑی بنانے کے ساتھ اپنی گاڑی فروختنا شروع کریں",
      createFirstAd: "اپنا پہلا اشتہار بنائیں",
      createNewAd: "نیا اشتہار بنائیں",
      loadingAds: "آپ کے اشتہار لوڈ ہو رہے ہیں...",
      tryAgain: "دوبارہ کوشش کریں",
      confirmDeletion: "حذف کی تصدیق",
      deleteAdMessage: "کیا آپ یقینی طور پر اس اشتہار کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔",
      deleteAd: "اشتہار حذف کریں",
      cancel: "منسوخ کریں",
      previous: "پچھلا",
      next: "اگلا",
      searching: "تلاش ہو رہا ہے...",
      noVehiclesFound: "کوئی گاڑی نہیں ملی",
      tryAdjustingSearch: "اپنی تلاش کی اصطلاح کریں",
      foundResults: "{count} نتیجہ{count !== 1 ? 'یں' : ''} ملیا",
      recentSearches: "حالیہ تلاشیں",
      clear: "صاف کریں",
      priceNotAvailable: "قیمت دستیاب نہیں",
      myProfile: "میری پروفائل",
      settings: "ترتیبات",
      theme: "تھیم",
      language: "زبان",
      signOut: "باہر ہوں",
      more: "مزید",
      dashboard: "ڈیش بورڈ",
      noEmail: "کوئی ای میل نہیں",
      // Footer translations
      findYourNextVehicle: "اعتماد کے ساتھ اپنی اگلی گاڑی تلاش کریں",
      company: "کمپنی",
      support: "سپورٹ",
      legal: "قانونی",
      aboutUs: "ہمارے بارے میں",
      careers: "ملازمتیں",
      blog: "بلاگ",
      allRightsReserved: "© {year} ایموو۔ جملہ حقوق محفوظ ہیں۔",
      facebook: "فیس بک",
      twitter: "ٹویٹر",
      instagram: "انسٹاگرام",
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
      myAds: "Mes Annonces",
      manageAds: "Gérez vos annonces de véhicules publiées",
      noAdsYet: "Aucune annonce encore",
      startSelling: "Commencez à vendre votre véhicule en créant votre première annonce aujourd'hui",
      createFirstAd: "Créer Votre Première Annonce",
      createNewAd: "Créer une Nouvelle Annonce",
      loadingAds: "Chargement de vos annonces...",
      tryAgain: "Réessayer",
      confirmDeletion: "Confirmer la Suppression",
      deleteAdMessage: "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action ne peut pas être annulée.",
      deleteAd: "Supprimer l'Annonce",
      cancel: "Annuler",
      previous: "Précédent",
      next: "Suivant",
      searching: "Recherche en cours...",
      noVehiclesFound: "Aucun véhicule trouvé",
      tryAdjustingSearch: "Essayez d'ajuster vos termes de recherche",
      foundResults: "{count} résultat{count !== 1 ? 's' : ''} trouvé{count !== 1 ? 's' : ''}",
      recentSearches: "Recherches Récentes",
      clear: "Effacer",
      priceNotAvailable: "Prix non disponible",
      myProfile: "Mon Profil",
      settings: "Paramètres",
      theme: "Thème",
      language: "Langue",
      signOut: "Se Déconnecter",
      more: "Plus",
      dashboard: "Tableau de Bord",
      noEmail: "Aucun e-mail",
      // Footer translations
      findYourNextVehicle: "Trouvez votre prochain véhicule en toute confiance",
      company: "Entreprise",
      support: "Support",
      legal: "Légal",
      aboutUs: "À Propos de Nous",
      careers: "Carrières",
      blog: "Blog",
      allRightsReserved: "© {year} Emov. Tous droits réservés.",
      facebook: "Facebook",
      twitter: "Twitter",
      instagram: "Instagram",
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
    <>
      {/* Left Gradient - Top of Hero - Maximum Size */}
      <img 
        src={`/${gradientLeft}`}
        alt=""
        className="absolute left-0 top-0 w-1/2 sm:w-1/3 md:w-1/3 h-full overflow-hidden"
        style={{
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
      <img 
        src={`/${gradientRight}`}
        alt=""
        className="absolute right-0 bottom-0 w-5/6 md:w-2/3 h-4/5"
        style={{
          backgroundSize: 'contain',
          backgroundPosition: 'right bottom',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
          zIndex: 0
        }}
      />
        
      {/* Wrapper for all three sections */}
      <div className="relative overflow-x-hidden">
        {/* Top Header Section */}
        <div className="bg-bg-secondary/90 w-full">
  {/* Top Bar */}
  

  {/* Header Section */}
  <div className="relative">
    <Header 
      userProfile={userProfile} 
      handleLogout={handleLogout} 
      onSearch={false} 
    />
  </div>

  {/* Navbar Section */}
  <div className="relative">
    <Navbar 
      isDark={theme === 'dark'}
      toggleTheme={toggleTheme}
      userProfile={userProfile}
      handleLogout={handleLogout}
    />
  </div>

  {/* Hero Section with Enhanced Gradients - Mobile Redesign */}
 <section className="relative w-full mt-18 overflow-hidden hide-scrollbar">
    {/* Enhanced Background Gradients */}
    <div className="absolute inset-0 pointer-events-none">
      {/* Left Gradient Overlay */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1/3 opacity-40 transition-opacity duration-700"
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(ellipse at left, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 30%, transparent 70%)'
            : 'radial-gradient(ellipse at left, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 30%, transparent 70%)',
        }}
      />
      
      {/* Right Gradient Overlay */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-1/3 opacity-40 transition-opacity duration-700"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at right, rgba(0, 255, 169, 0.12) 0%, rgba(0, 255, 169, 0.06) 30%, transparent 70%)'
            : 'radial-gradient(ellipse at right, rgba(0, 255, 169, 0.08) 0%, rgba(0, 255, 169, 0.04) 30%, transparent 70%)',
        }}
      />
    </div>

    <div className="relative max-w-[2000px] mx-auto">
      {/* Content - Optimized for Mobile */}
      <div className="text-center pt-6 pb-8 md:pt-8 md:pb-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="w-full text-center max-w-4xl sm:max-w-5xl lg:max-w-6xl mx-auto">
          <h1 className="text-text-primary font-bold text-2xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 sm:mb-3 md:mb-4 leading-tight tracking-tight"
            style={{
              textShadow: theme === 'dark' 
                ? '0 2px 20px rgba(0, 0, 0, 0.3)' 
                : '0 2px 10px rgba(0, 0, 0, 0.05)',
              lineHeight: '1.2'
            }}
          >
            {t.findVehicles}
          </h1>
          <h2 className="text-base sm:text-base md:text-lg lg:text-xl font-normal mb-4 md:mb-6 leading-relaxed text-text-tertiary opacity-90"
            style={{
              lineHeight: '1.6',
              letterSpacing: '0.01em'
            }}
          >
            {t.tagline}
          </h2>
        </div>

      {/* Mobile Search Bar - Fixed Version   */}
<div className={`md:hidden w-full -mb-4 ${showSearchResults ? 'pb-96' : ''} overflow-visible`}>
  <div className="relative max-w-md mx-auto px-4">
    {/* Premium Glassmorphic Search Bar */}
    <div 
      className="relative w-full h-14 rounded-2xl border transition-all duration-300 hover:border-white/60 focus-within:border-emov-purple focus-within:ring-2 focus-within:ring-emov-purple/30 group"
      style={{
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.3)',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: theme === 'dark'
          ? `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)
          `
          : `
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.2)
          `,
      }}
    >
      {/* Inner Glow Effect */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none rounded-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
        }}
      />

      {/* Search Icon */}
      <div className="absolute left-4 z-10 flex items-center h-full">
        <svg 
          className={`w-5 h-5 transition-all duration-300 ${searchQuery ? 'scale-110' : ''} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Input Field */}
      <input
        type="text"
        placeholder={t.searchPlaceholder || "Search for vehicles..."}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        onFocus={() => {
          if (searchQuery.trim()) {
            setShowSearchResults(true);
          }
        }}
        className={`w-full h-full pl-12 pr-16 bg-transparent ${theme === 'dark' ? 'text-white placeholder-gray-300' : 'text-gray-900 placeholder-gray-600'} text-base font-medium focus:outline-none z-10 transition-all duration-300`}
      />

      {/* Right Side Icons */}
      <div className="absolute right-2 z-10 flex items-center h-full">
        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowSearchResults(false);
            }}
            className={`p-2 rounded-full transition-all duration-200 ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>

    {/* Mobile Search Results Dropdown - FIXED */}
    {showSearchResults && (
      <div 
        className="absolute left-4 right-4 mt-2 rounded-2xl border overflow-hidden transition-all duration-300 z-50"
        style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          boxShadow: theme === 'dark' 
            ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.3)'
            : '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div 
          className="max-h-[400px] overflow-y-auto"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(35, 35, 40, 0.98) 0%, rgba(25, 25, 30, 0.96) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.96) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          {/* Recent Searches */}
          {!searchQuery.trim() && recentSearches.length > 0 && (
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.recentSearches}</h3>
                <button
                  onClick={clearRecentSearches}
                  className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200`}
                >
                  {t.clear}
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(search);
                      handleSearch(search);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                      theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emov-purple border-t-transparent"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-4 space-y-2">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                {t.foundResults.replace('{count}', searchResults.length).replace('{count !== 1 ? \'s\' : \'\'}', searchResults.length !== 1 ? 's' : '')}
              </h3>
              {searchResults.map((ad) => (
                <SearchResultItem 
                  key={ad.AdID || ad.id || ad.adId || ad._id}
                  ad={ad}
                  isDark={theme === 'dark'}
                  handleAdClick={handleAdClick}
                />
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8">
              <svg className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No vehicles found</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Try adjusting your search terms</p>
            </div>
          ) : null}
        </div>
      </div>
    )}
  </div>
</div>
        {/* Desktop Search Bar - Original */}
        <div className={`hidden md:block w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 transition-all duration-500 ${showSearchResults ? 'pb-96' : ''}`}>
          <div className="relative max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto search-container">
            <div 
              className="relative w-full h-16 sm:h-18 md:h-20 rounded-3xl border transition-all duration-300 hover:border-white/60 focus-within:border-emov-purple focus-within:ring-4 focus-within:ring-emov-purple/20 group"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(40, 40, 45, 0.95) 0%, rgba(25, 25, 30, 0.92) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.92) 100%)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                boxShadow: theme === 'dark'
                  ? `
                    0 10px 40px rgba(0, 0, 0, 0.4),
                    0 4px 12px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
                    inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)
                  `
                  : `
                    0 10px 40px rgba(0, 0, 0, 0.1),
                    0 4px 12px rgba(0, 0, 0, 0.06),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.8),
                    inset 0 -1px 0 0 rgba(0, 0, 0, 0.08)
                  `,
              }}
            >
              {/* Enhanced Radial Gradient Overlay */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none rounded-3xl transition-opacity duration-300 group-hover:opacity-60"
                style={{
                  background: 'radial-gradient(circle at 25% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 25%, transparent 60%)',
                }}
              />

              {/* Shimmer Effect on Hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.25) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                }}
              />

              {/* Search Icon */}
              <div className="absolute left-5 sm:left-6 md:left-7 z-10 flex items-center h-full">
                <svg 
                  className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300 ${searchQuery ? 'scale-110' : ''} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Input Field */}
              <input
                type="text"
                placeholder={t.searchPlaceholder || "Search for vehicles..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setShowSearchResults(true);
                  }
                }}
                className={`w-full h-full pl-14 sm:pl-16 md:pl-20 pr-20 sm:pr-24 md:pr-28 bg-transparent ${theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'} text-base sm:text-lg md:text-xl font-medium focus:outline-none z-10 transition-all duration-300`}
                style={{
                  textShadow: theme === 'dark' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                }}
              />

              {/* Right Side Icons Container */}
              <div className="absolute right-3 sm:right-4 md:right-5 z-10 flex items-center h-full space-x-2">
                
                {/* Clear Button (X) */}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 active:scale-90 flex items-center justify-center"
                    aria-label={t.clear}
                  >
                    <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Search Results Dropdown */}
            <div 
              className={`absolute top-full left-0 right-0 mt-4 rounded-2xl border overflow-hidden transition-all duration-300 ${showSearchResults ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'} z-50`}
              style={{
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                boxShadow: theme === 'dark' 
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.3)'
                  : '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div 
                className="max-h-[500px] overflow-y-auto"
                style={{
                  background: theme === 'dark' 
                    ? 'linear-gradient(135deg, rgba(35, 35, 40, 0.98) 0%, rgba(25, 25, 30, 0.96) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.96) 100%)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                }}
              >
                {/* Recent Searches */}
                {!searchQuery.trim() && recentSearches.length > 0 && (
                  <div className={`p-5 sm:p-6 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.recentSearches}</h3>
                      <button
                        onClick={clearRecentSearches}
                        className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200`}
                      >
                        {t.clear}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchSubmit(search)}
                          className={`w-full text-left px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/70'} rounded-xl transition-all duration-200 flex items-center space-x-3 group`}
                        >
                          <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} group-hover:scale-110 transition-transform duration-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchQuery.trim() && (
                  <div className="p-5 sm:p-6">
                    {isSearching ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emov-purple mx-auto"></div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-3`}>{t.searching}</p>
                    </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                          {t.foundResults.replace('{count}', searchResults.length).replace('{count !== 1 ? \'s\' : \'\'}', searchResults.length !== 1 ? 's' : '')}
                        </h3>
                        {searchResults.map((ad) => (
                          <SearchResultItem 
                            key={ad.AdID || ad.id || ad.adId || ad._id}
                            ad={ad}
                            isDark={theme === 'dark'}
                            handleAdClick={handleAdClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t.noVehiclesFound}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>{t.tryAdjustingSearch}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Spacer to allow search bar overlap */}


</div>

<style jsx>{`
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  /* Custom Scrollbar for Search Results */
  .search-container ::-webkit-scrollbar {
    width: 6px;
  }

  .search-container ::-webkit-scrollbar-track {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    border-radius: 10px;
  }

  .search-container ::-webkit-scrollbar-thumb {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 10px;
    transition: background 0.3s ease;
  }

  .search-container ::-webkit-scrollbar-thumb:hover {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  }

  /* Smooth scrolling */
  .search-container > div {
    scroll-behavior: smooth;
  }

  /* Focus visible for accessibility */
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--emov-purple, #8b5cf6);
    outline-offset: 2px;
  }

  /* Hide scrollbars on mobile */
  @media (max-width: 767px) {
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    
    /* Hide horizontal scrollbar */
    html, body {
      overflow-x: hidden;
    }
    
    /* Ensure no horizontal overflow */
    * {
      box-sizing: border-box;
    }
    
    .w-full {
      max-width: 100vw;
    }
  }
`}</style>

      {/* Main Content */}
      <main className="w-full relative z-10">
        {/* Browse Used Vehicles Section with Tabs */}
 <section className="w-full bg-bg-secondary py-8 sm:py-12 md:py-16">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
    <div className="w-full bg-transparent rounded-xl overflow-hidden">
      <div className="w-full p-3 sm:p-4 md:p-6 bg-bg-secondary rounded-t-lg">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-text-primary">
          {t.browseUsedVehicles}
        </h2>

        {/* Tabs */}
        <div className="w-full pb-1">
          {/* Mobile: Enhanced tabs */}
          <div className="md:hidden flex space-x-1 overflow-x-auto pb-1 no-scrollbar">
            {['Category', 'Budget', 'Brand', 'Model', 'Body Type'].map((tabKey) => {
              const keyMap = {
                'Category': 'category',
                'Budget': 'budget', 
                'Brand': 'brand',
                'Model': 'model',
                'Body Type': 'bodytype'
              };
              const tabLabel = t.tabs[keyMap[tabKey]];
              return (
              <button
                key={tabKey}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tabKey
                    ? 'text-emov-purple border-b-2 border-emov-purple'
                    : 'text-text-secondary hover:text-text-primary border-b-2 border-transparent'
                }`}
                onClick={() => handleTabChange(tabKey)}
              >
                {tabLabel}
              </button>
            );
            })}
          </div>

          {/* Desktop: Original tab layout */}
          <div className="hidden md:block overflow-x-auto pb-1">
            <div style={{ fontSize: '20px' }} className="flex space-x-1 border-b border-gray-600 w-max min-w-full">
              {['Category', 'Budget', 'Brand', 'Model', 'Body Type'].map((tabKey) => {
                const keyMap = {
                  'Category': 'category',
                  'Budget': 'budget',
                  'Brand': 'brand', 
                  'Model': 'model',
                  'Body Type': 'bodytype'
                };
                const tabLabel = t.tabs[keyMap[tabKey]];
                return (
                <button
                  key={tabKey}
                  className={`px-4 py-3 text-sm sm:text-base whitespace-nowrap relative ${
                    activeTab === tabKey
                      ? 'text-emov-purple after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emov-purple'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => handleTabChange(tabKey)}
                >
                  {tabLabel}
                </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative w-full pb-4 sm:pb-6 px-0 bg-bg-secondary rounded-lg">
        <div className="relative w-full overflow-hidden">
          {/* Arrows - Visible on all screens */}
          <button
            onClick={() => scrollLeft(activeTab)}
            className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-bg-primary rounded-full border-2 border-gray-600 text-text-primary hover:bg-bg-tertiary transition-colors p-1.5 sm:p-2"
            disabled={!canScrollLeft(activeTab)}
          >
            <FaChevronRight style={{ color: '#7B3DFF' }} className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 transform rotate-180" />
          </button>

          <button
            onClick={() => scrollRight(activeTab)}
            className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-bg-primary rounded-full border-2 border-gray-600 text-text-primary hover:bg-bg-tertiary transition-colors p-1.5 sm:p-2"
            disabled={!canScrollRight(activeTab)}
          >
            <FaChevronRight style={{ color: '#7B3DFF' }} className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
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
                    <p className="text-text-tertiary">
                      {t.noDataAvailable || 'No data available for this category'}
                    </p>
                  </div>
                );
              }

              // Determine if current tab has images
              const hasImages = ['Category', 'Brand'].includes(activeTab);
              const isTextOnlyTab = ['Budget', 'Model', 'Body Type'].includes(activeTab);
              
              // For mobile card rendering, use more specific logic - FORCE BUDGET TO HAVE NO ICONS
              const shouldShowIcon = activeTab === 'Budget' ? false : ['Category', 'Brand'].includes(activeTab);
              
              // MOBILE: Show 8 items per slide for categories with images, 9 for text-only tabs (3 rows)
              // DESKTOP: Keep original logic
              const itemsPerSlideMobile = hasImages ? 8 : (isTextOnlyTab ? 9 : 12);
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
                    {/* MOBILE: 2x3 grid for categories with images, 3x3 grid for text-only tabs */}
                    {/* DESKTOP: Keep original layout */}
                    <div className={`grid gap-1.5 sm:gap-2 md:gap-3 w-full px-2 sm:px-4 md:px-6 ${
                      window.innerWidth < 768 
                        ? (hasImages ? 'grid-cols-4' : 'grid-cols-3')
                        : 'grid-cols-2 md:sm:grid-cols-3 lg:grid-cols-5'
                    }`}>
                      {slideItems.map((item, index) => {
                        const displayName = item.displayName || item.name || item.CategoryName || 'Unnamed Category';

                        // MOBILE card layout - simplified for categories
                        const mobileCard = () => (
                          <div className="flex flex-col items-center justify-center h-full w-full p-2">
                            {shouldShowIcon ? (
                              <>
                                {/* Category Icon/Image */}
                                <div className="flex items-center justify-center mb-2 flex-shrink-0" style={{ height: '32px', width: '32px' }}>
                                  {item.icon ? (
                                    <div className="flex items-center justify-center w-8 h-8 bg-bg-tertiary rounded-full border border-border-primary">
                                      {React.cloneElement(item.icon, {
                                        size: 16,
                                        style: { color: 'var(--text-secondary)' }
                                      })}
                                    </div>
                                  ) : (
                                    <img
                                      src={item.image}
                                      alt={displayName}
                                      className="w-full h-full object-contain"
                                      style={{
                                        opacity: activeTab === 'Category' ? 0.8 : 1
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                                
                                {/* Category Name */}
                                <div className="text-center w-full">
                                  <div className="text-text-primary line-clamp-2 leading-tight text-xs font-medium">
                                    {displayName}
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Text-only tabs - perfectly centered */
                              <div className="flex items-center justify-center h-full w-full">
                                <div className="text-center">
                                  <div className="text-text-primary line-clamp-2 leading-tight text-xs font-medium">
                                    {displayName}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );

                        // DESKTOP card layout - keep original
                        const desktopCard = () => {
                          return (
                            <div className="flex flex-col items-center justify-center p-4 h-full w-full">
                              {shouldShowIcon ? (
                                <>
                                  <div className="flex items-center justify-center mb-3 flex-shrink-0" style={{ height: '50px', width: '50px' }}>
                                    {item.icon ? (
                                      <div className="flex items-center justify-center w-12 h-12 bg-bg-primary rounded-full border border-border-primary">
                                        {React.cloneElement(item.icon, { 
                                          size: 24, 
                                          style: { color: 'var(--text-secondary)' } 
                                        })}
                                      </div>
                                    ) : (
                                      <img
                                        src={item.image}
                                        alt={displayName}
                                        className="w-full h-full object-contain"
                                        style={{
                                          filter: activeTab === 'Category' 
                                            ? 'brightness(0) saturate(100%) invert(30%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(80%) contrast(85%)'
                                            : 'none',
                                          opacity: activeTab === 'Category' ? 0.8 : 1
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                  </div>
                                  
                                  <div className="text-center w-full">
                                    <div className="text-text-primary line-clamp-2 text-sm">
                                      {displayName}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                /* Text-only tabs - perfectly centered */
                                <div className="flex items-center justify-center h-full w-full">
                                  <div className="text-center">
                                    <div className="text-text-primary line-clamp-2 text-sm">
                                      {displayName}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        };

                        return (
                          <div
                            key={`${item.id || index}-${activeTab}`}
                            className={`flex flex-col rounded-lg cursor-pointer transition-all duration-200 ${
                              theme === 'dark'
                                ? 'bg-bg-card border border-gray-600'
                                : 'bg-white border border-gray-300'
                            } hover:border-purple-400 hover:shadow-md`}
                            style={{
                              width: window.innerWidth < 768 
                                ? '100%' 
                                : (hasImages ? '180px' : '160px'),
                              height: window.innerWidth < 768 
                                ? (isTextOnlyTab ? '60px' : '80px')
                                : (hasImages ? '140px' : '80px'),
                              minHeight: window.innerWidth >= 768 ? '80px' : 'auto'
                            }}
                            onClick={() => safeNavigateToFilteredAds(activeTab, item)}
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

          {/* CAROUSEL INDICATORS - Always visible */}
          <div className="flex justify-center items-center space-x-2 mt-3 sm:mt-4">
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
              
              const dataKey = tabDataMap[activeTab];
              currentTabData = Array.isArray(transformedData[dataKey]) ? transformedData[dataKey] : [];
              
              const hasImages = ['Category', 'Brand'].includes(activeTab);
              const isTextOnlyTab = ['Budget', 'Model', 'Body Type'].includes(activeTab);
              const itemsPerSlideMobile = hasImages ? 8 : (isTextOnlyTab ? 9 : 12);
              const totalSlides = Math.ceil(currentTabData.length / (window.innerWidth < 768 ? itemsPerSlideMobile : itemsPerPage));
              
              if (totalSlides > 1) {
                return Array.from({ length: totalSlides }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlides(prev => ({ ...prev, [activeTab]: index }))}     
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlides[activeTab] === index 
                        ? 'bg-green-500 w-6' 
                        : 'bg-gray-400 hover:bg-gray-500 w-2'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ));
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

 

        {/* Recently Added Section */}

{/* Enhanced Recently Added Section - "NEW" Badge Removed */}
<section className="w-full bg-bg-secondary py-8 sm:py-12 md:py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8">
      {t.recentlyAdded}
    </h2>

    {loadingRecentAds ? (
      <div className="text-center py-16">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-8 border-bg-tertiary border-t-emov-purple animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaCar className="w-12 h-12 text-emov-purple" />
          </div>
        </div>
        <p className="text-xl font-semibold text-text-primary">Loading latest vehicles...</p>
        <p className="mt-2 text-text-secondary">Please wait a moment</p>
      </div>
    ) : recentAdsError ? (
      <div className="text-center py-16">
        <p className="text-lg text-red-600 mb-6">{recentAdsError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-emov-purple text-white rounded-xl hover:bg-emov-purple-dark transition-all shadow-lg font-medium"
        >
          Retry
        </button>
      </div>
    ) : recentlyAddedVehicles.length > 0 ? (
      <div className="relative">
        <CarouselNavigation
          onPrev={() => scrollLeft('Recently Added', recentlyAddedVehicles, carouselItemsPerRow)}
          onNext={() => scrollRight('Recently Added', recentlyAddedVehicles, carouselItemsPerRow)}
          canGoPrev={canScrollLeft('Recently Added')}
          canGoNext={canScrollRight('Recently Added', recentlyAddedVehicles, carouselItemsPerRow)}
          section="recently added vehicles"
        />

        <div className="relative overflow-hidden">
          {/* Mobile Carousel */}
          <div
            className="flex transition-transform duration-500 ease-out sm:hidden"
            style={{ transform: `translateX(-${currentSlides['Recently Added'] * 100}%)` }}
          >
            {recentlyAddedVehicles.map((vehicle, index) => {
              const imageUrl = vehicle.image || '/mockvehicle.png';

              return (
                <div key={`mobile-${vehicle.AdID || vehicle.id}-${index}`} className="w-full flex-shrink-0 px-2">
                  <div
                    onClick={() => navigate(`/ad/${vehicle.AdID || vehicle.id}`, { state: { adData: vehicle } })}
                    className="bg-bg-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-border-primary group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={vehicle.VehicleName || vehicle.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => (e.target.src = '/mockvehicle.png')}
                      />
                      {/* Emov Check Badge */}
                      <img
                        src="/emovcheck.png"
                        alt="Emov Verified"
                        className="absolute top-3 right-3 w-12 h-12 object-contain z-10"
                      />
                      {/* "NEW" Badge Removed */}
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-emov-purple transition-colors">
                        {vehicle.VehicleName || vehicle.title || 'Vehicle'}
                      </h3>

                      <div className="text-2xl font-bold text-emov-purple mb-3">
                        {vehicle.VehiclePrice ? `PKR ${parseInt(vehicle.VehiclePrice).toLocaleString()}` : 'Price on call'}
                      </div>

                      <div className="space-y-2 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vehicle.RegistrationYear || 'N/A'}</span>
                          <span>•</span>
                          <span>{vehicle.VehicleMileage ? `${vehicle.VehicleMileage.toLocaleString()} km` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-emov-purple/70" />
                          <span className="truncate">{vehicle.LocationName || vehicle.location || 'Location'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Carousel */}
          <div
            className="hidden sm:flex transition-transform duration-500 ease-out gap-6"
            style={{ transform: `translateX(-${currentSlides['Recently Added'] * 100}%)` }}
          >
            {Array(Math.ceil(recentlyAddedVehicles.length / carouselItemsPerRow))
              .fill()
              .map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  style={{ minWidth: '100%' }}
                >
                  {recentlyAddedVehicles
                    .slice(groupIndex * carouselItemsPerRow, (groupIndex + 1) * carouselItemsPerRow)
                    .map((vehicle) => {
                      const imageUrl = vehicle.image || '/mockvehicle.png';

                      return (
                        <div
                          key={vehicle.AdID || vehicle.id}
                          onClick={() => navigate(`/ad/${vehicle.AdID || vehicle.id}`, { state: { adData: vehicle } })}
                          className="bg-bg-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-border-primary group"
                        >
                          <div className="relative h-56 overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={vehicle.VehicleName || vehicle.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => (e.target.src = '/mockvehicle.png')}
                            />
                            {/* Emov Check Badge */}
                            <img
                              src="/emovcheck.png"
                              alt="Emov Verified"
                              className="absolute top-3 right-3 w-12 h-12 object-contain z-10"
                            />
                            {/* "NEW" Badge Removed */}
                          </div>

                          <div className="p-5">
                            <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-emov-purple transition-colors">
                              {vehicle.VehicleName || vehicle.title || 'Vehicle'}
                            </h3>

                            <div className="text-2xl font-bold text-emov-purple mb-3">
                              {vehicle.VehiclePrice ? `PKR ${parseInt(vehicle.VehiclePrice).toLocaleString()}` : 'Price on call'}
                            </div>

                            <div className="space-y-2 text-sm text-text-secondary">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{vehicle.RegistrationYear || 'N/A'}</span>
                                <span>•</span>
                                <span>{vehicle.VehicleMileage ? `${vehicle.VehicleMileage.toLocaleString()} km` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="w-4 h-4 text-emov-purple/70" />
                                <span className="truncate">{vehicle.LocationName || vehicle.location || 'Location'}</span>
                              </div>
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
      <div className="text-center py-16">
        <div className="mx-auto w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
          <FaCar className="w-16 h-16 text-gray-400" />
        </div>
        <p className="text-xl text-text-secondary">No recent vehicles available at the moment</p>
      </div>
    )}
  </div>
</section>

{/* Enhanced Featured Vehicles Section - "Featured" Badge Removed */}
<section className="w-full bg-bg-primary py-12 sm:py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8">
      {t.featuredVehicles}
    </h2>

    <div className="relative">
      <CarouselNavigation
        onPrev={() => scrollLeft('Featured Vehicles', featuredVehicles, carouselItemsPerRow)}
        onNext={() => scrollRight('Featured Vehicles', featuredVehicles, carouselItemsPerRow)}
        canGoPrev={canScrollLeft('Featured Vehicles')}
        canGoNext={canScrollRight('Featured Vehicles', featuredVehicles, carouselItemsPerRow)}
        section="featured vehicles"
      />

      <div className="relative overflow-hidden">
        {/* Mobile Carousel */}
        <div
          className="flex transition-transform duration-500 ease-out sm:hidden"
          style={{ transform: `translateX(-${currentSlides['Featured Vehicles'] * 100}%)` }}
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
            },
          ].map((vehicle) => {
            const imageUrl = '/mockvehicle.png'; // Replace with real data if available

            return (
              <div key={`mobile-${vehicle.id}`} className="w-full flex-shrink-0 px-2">
                <div
                  className="bg-bg-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-border-primary group"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={vehicle.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => (e.target.src = '/mockvehicle.png')}
                    />
                    {/* Emov Check Badge */}
                    <img
                      src="/emovcheck.png"
                      alt="Emov Verified"
                      className="absolute top-3 right-3 w-12 h-12 object-contain z-10"
                    />
                    {/* "Featured" Badge Removed */}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-emov-purple transition-colors">
                      {vehicle.title}
                    </h3>

                    <div className="text-2xl font-bold text-emov-purple mb-3">
                      {vehicle.price}
                    </div>

                    <div className="space-y-2 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vehicle.year}</span>
                        <span>•</span>
                        <span>{vehicle.mileage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-emov-purple/70" />
                        <span className="truncate">{vehicle.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Carousel */}
        <div
          className="hidden sm:flex transition-transform duration-500 ease-out gap-6"
          style={{ transform: `translateX(-${currentSlides['Featured Vehicles'] * 100}%)` }}
        >
          {Array(Math.ceil(featuredVehicles.length / carouselItemsPerRow))
            .fill()
            .map((_, groupIndex) => (
              <div
                key={groupIndex}
                className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                style={{ minWidth: '100%' }}
              >
                {featuredVehicles
                  .slice(groupIndex * carouselItemsPerRow, (groupIndex + 1) * carouselItemsPerRow)
                  .map((vehicle) => {
                    const imageUrl = vehicle.image || '/mockvehicle.png';

                    return (
                      <div
                        key={vehicle.id}
                        className="bg-bg-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-border-primary group"
                      >
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={vehicle.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => (e.target.src = '/mockvehicle.png')}
                          />
                          {/* Emov Check Badge */}
                          <img
                            src="/emovcheck.png"
                            alt="Emov Verified"
                            className="absolute top-3 right-3 w-12 h-12 object-contain z-10"
                          />
                          {/* "Featured" Badge Removed */}
                        </div>

                        <div className="p-5">
                          <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-emov-purple transition-colors">
                            {vehicle.title}
                          </h3>

                          <div className="text-2xl font-bold text-emov-purple mb-3">
                            {vehicle.price}
                          </div>

                          <div className="space-y-2 text-sm text-text-secondary">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{vehicle.year}</span>
                              <span>•</span>
                              <span>{vehicle.mileage}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="w-4 h-4 text-emov-purple/70" />
                              <span className="truncate">{vehicle.location}</span>
                            </div>
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

                     {/* Other Services Section */}
        <section className="w-full bg-bg-primary py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 style={{ fontSize: '24px' }} className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">{t.otherServices}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {otherServices.map((service, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-lg border border-border-primary bg-bg-secondary shadow-md hover:shadow-xl hover:border-border-secondary transition-all duration-300"
                >
                  {/* Subtle beautiful car background - reliable Pexels URLs */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-35 transition-opacity duration-300"
                    style={{
                      backgroundImage: `url(${
                        [
                          'https://images.pexels.com/photos/337909/pexels-photo-337909.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/2127033/pexels-photo-2127033.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/6894429/pexels-photo-6894429.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/909907/pexels-photo-909907.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/3972755/pexels-photo-3972755.jpeg?auto=compress&cs=tinysrgb',
                          'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb'
                        ][index % 10]
                      })`,
                    }}
                  />

                  {/* Removed the dark overlay as requested */}

                  {/* Content - now with black text for clarity on light/subtle background */}
                  <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center h-48 sm:h-56 text-center">
                    <div className="text-4xl sm:text-5xl mb-4 text-emov-purple">
                      {service.icon}
                    </div>
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {service.name}
                    </span>
                  </div>
                </div>
              ))}
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
                  <div 
                    key={brand.id} 
                    className="flex flex-col items-center group cursor-pointer"
                    onClick={() => safeNavigateToFilteredAds('Brand', brand)}
                  >
                    <div className="w-24 h-24 rounded-full bg-bg-primary border-2 border-border-primary p-2 flex items-center justify-center mb-2 transition-all duration-200 group-hover:border-emov-purple">
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
                              e.target.src = '';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-text-primary text-center mt-2 group-hover:text-emov-purple transition-colors">{brand.name}</span>
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
      <footer className={`py-8 sm:py-12 w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-900'} text-white`}>
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
              <p className="text-gray-400 text-sm sm:text-base">{t.findYourNextVehicle}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 w-full lg:w-auto">
              {[t.company, t.support, t.legal].map((section) => (
                <div key={section}>
                  <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: colors.green }}>{section}</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {[t.aboutUs, t.careers, t.blog].map((item) => (
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
                {t.allRightsReserved.replace('{year}', new Date().getFullYear())}
              </p>
              <div className="flex space-x-4 sm:space-x-6">
                {[t.facebook, t.twitter, t.instagram].map((social) => (
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

      <MobileBottomNav activePage="home" isVisible={isBottomNavVisible} />
      </div>
    </>
  );
}

export default Dashboard;
