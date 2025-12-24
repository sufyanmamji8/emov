  import React, { useState, useEffect } from 'react';
  import { useParams, useNavigate, useLocation } from 'react-router-dom';
  import { FaCar } from 'react-icons/fa';
  import apiService from '../services/Api';
  import { useChat } from '../contexts/ChatContext';
  import { toast } from 'react-toastify';

  const AdDetail = () => {
    const { adId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterData, setFilterData] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showAllDetails, setShowAllDetails] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    
    const { startNewChat } = useChat();

    const [expandedSections, setExpandedSections] = useState({
    serviceHistory: false,
    powertrainSpecs: false,
  });

  const getBodyTypeName = (bodyTypeId) => {
    if (!bodyTypeId && bodyTypeId !== 0) return 'N/A';
    const id = String(bodyTypeId);
    const bodyTypesData = ad?.body_type || ad?.bodyType || [];
    
    // Debug logging
    console.log('BodyTypeID:', bodyTypeId);
    console.log('Ad body types:', bodyTypesData);
    
    if (bodyTypesData.length > 0) {
      const bodyType = bodyTypesData.find(bt => 
        String(bt.BodyTypeID || bt.id) === id
      );
      console.log('Found body type:', bodyType);
      if (bodyType) {
        return bodyType?.BodyTypeName || bodyType?.name || 'N/A';
      }
    }
      
      // Fallback: try localStorage
      const storedBodyTypes = JSON.parse(localStorage.getItem('vehicleBodyTypes') || '[]');
      const fallbackBodyType = storedBodyTypes.find(bt => 
        String(bt.BodyTypeID || bt.id) === id
      );
      console.log('Fallback body type:', fallbackBodyType);
      
      if (fallbackBodyType) {
        return fallbackBodyType?.BodyTypeName || fallbackBodyType?.name || 'N/A';
      }
      
      // Last resort: return the ID as string
      return `Body Type ${id}`;
    };

    useEffect(() => {
      const loadAdData = async () => {
        try {
          console.log('🔄 Loading ad data for ID:', adId);

          // ✅ METHOD 0: If we navigated here with ad data in state, use it as an initial value
          const stateAd = location.state?.adData;
          if (stateAd) {
            console.log('✅ Using ad data from navigation state as initial value');
            setAd(stateAd);
            // Do NOT return here: we still fetch from API to enrich with full seller info
          }

          // ✅ METHOD 1: First try direct API call
          try {
            console.log('🔍 Trying direct API endpoint...');
            const directResponse = await apiService.ads.getById(adId);
            console.log('✅ Direct API call successful');
            setAd(directResponse.data);
            setLoading(false);
            return;
          } catch (directError) {
            console.log('❌ Direct API failed, trying getAll method...');
          }

          // ✅ METHOD 2: Fetch ALL ads and find the specific one
          console.log('🔍 Fetching ALL ads to find ID:', adId);
          const allAdsResponse = await apiService.ads.getAll(1, 1000);
          const allAds = allAdsResponse?.data || [];

          console.log('📊 Total ads available:', allAds.length);
          console.log('🆔 All available Ad IDs:', allAds.map(ad => ad.AdID || ad.id));

          const targetIdStr = String(adId).trim();

          // ✅ Find the specific ad (robust string/number comparison and multiple ID fields)
          const foundAd = allAds.find(ad => {
            const possibleIds = [ad.AdID, ad.id, ad.adId, ad.adID].filter(Boolean);
            return possibleIds.some(pid => String(pid) === targetIdStr);
          });

          if (foundAd) {
            console.log('✅ Ad found in getAll response');
            setAd(foundAd);
          } else {
            console.log('❌ Ad not found in any page');
            setError(`Ad ID ${adId} not found. Available IDs: ${allAds
              .slice(0, 10)
              .map(ad => ad.AdID || ad.id)
              .join(', ')}${allAds.length > 10 ? '...' : ''}`);
          }

          setLoading(false);
        } catch (error) {
          console.error('❌ Error loading ad details:', error);
          setError('Ad not found or may have been removed');
          setLoading(false);
        }
      };

      loadAdData();
    }, [adId, location.state]);

    const handleGoBack = () => {
      navigate(-1);
    };

    const handleContactSeller = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
          // Redirect to login with return URL
          navigate('/login', { state: { from: location.pathname } });
          return;
        }

        setChatLoading(true);
        
        // Get seller's user ID from the ad data
        const sellerUserId = ad.SellerID || ad.UserID || ad.seller_id || '19';
        
        console.log('Starting chat for ad:', ad.AdID, 'with seller:', sellerUserId);
        
        const newChat = await startNewChat(
          ad.AdID, 
          `Hi, I'm interested in your ${ad.VehicleName}`,
          sellerUserId,
          {
            name: sellerName,
            image: sellerImage
          }
        );
        
        console.log('New chat created:', newChat);
        
        // Navigate to chats page with the new chat active
        navigate('/chats', { 
          state: { 
            activeChatId: newChat.conversation_id
          } 
        });
      } catch (error) {
        console.error('Error starting chat:', error);
        toast.error(`Failed to start chat: ${error.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setChatLoading(false);
      }
    };

    // Improved avatar component function
    const renderSellerAvatar = (sellerInfo, size = 'w-24 h-24', textSize = 'text-3xl') => {
      const { image, name } = sellerInfo;
      const displayName = name && name !== 'N/A' ? name : 'User';
      const firstLetter = displayName.charAt(0).toUpperCase();
      
      // Check if image exists and is not default
      const hasValidImage = image && image !== '/default-avatar.png' && image !== 'N/A';
      
      return (
        <div className={`relative ${size}`}>
          {hasValidImage ? (
            <img
              src={image}
              alt={displayName}
              className="w-full h-full rounded-full object-cover border-2 border-emov-purple/20"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                // Show the fallback letter when image fails to load
                const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`avatar-fallback ${!hasValidImage ? 'flex' : 'hidden'} items-center justify-center w-full h-full rounded-full bg-emov-purple/10 border-2 border-emov-purple/20 ${textSize} font-bold text-emov-purple`}
          >
            {firstLetter}
          </div>
        </div>
      );
    };

    const toggleSection = (section) => {
  setExpandedSections(prev => ({
    ...prev,
    [section]: !prev[section]
  }));
};

    const getImageUrls = (imageData) => {
      if (!imageData) {
        return ['/mockvehicle.png'];
      }
      
      if (Array.isArray(imageData) && imageData.length > 0) {
        return imageData.map(img => {
          if (typeof img === 'string' && img.startsWith('http')) {
            return img;
          }
          return `https://api.emov.com.pk/image/${img}`;
        });
      }
      
      if (typeof imageData === 'string') {
        return [imageData.startsWith('http') ? imageData : `https://api.emov.com.pk/image/${imageData}`];
      }
      
      return ['/mockvehicle.png'];
    };

    const images = ad ? getImageUrls(ad.Images) : [];

    if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-secondary">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emov-purple"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaCar className="w-6 h-6 text-emov-purple" />
            </div>
          </div>
          <p className="mt-6 text-text-primary font-medium text-lg">Loading vehicles...</p>
          <p className="mt-2 text-text-secondary text-sm">Please wait a moment</p>
        </div>
      );
    }

    if (error || !ad) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="text-center p-8 max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {error?.includes('log in') ? 'Authentication Required' : 'Ad Not Found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {error || 'The ad you are looking for does not exist or has been removed.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoBack}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Go Back
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-emov-purple text-white rounded-lg font-medium hover:bg-emov-purple/90 transition-colors duration-200"
              >
                Go to Home
              </button>
            </div>
            {error?.includes('log in') && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Already have an account?</p>
                <button
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  className="w-full py-2.5 px-4 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200"
                >
                  Sign In to Continue
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Debug: Log the full ad data to inspect available fields
    console.log('Ad data:', ad);
    
    // Extract seller information (support multiple possible field names)
    const sellerSource = ad?.seller || ad?.user || ad?.User || ad?.owner || {};

    const sellerName =
      ad?.SellerName ||
      ad?.sellerName ||
      sellerSource?.name ||
      sellerSource?.Name ||
      ad?.UserName ||
      ad?.username ||
      ad?.Name ||
      ad?.name ||
      'N/A';

    const sellerEmail =
      ad?.SellerEmail ||
      ad?.emailAddress ||
      ad?.Email ||
      sellerSource?.email ||
      sellerSource?.Email ||
      ad?.UserEmail ||
      'N/A';

    // Build seller image URL from possible fields
    const rawSellerImage =
      ad?.SellerImage ||
      ad?.UserProfile ||
      ad?.UserImage ||
      sellerSource?.image ||
      sellerSource?.avatar ||
      sellerSource?.profileImage ||
      '';

    const sellerImage = rawSellerImage
      ? (rawSellerImage.startsWith('http')
          ? rawSellerImage
          : `https://api.emov.com.pk/image/${rawSellerImage}`)
      : '/default-avatar.png';

    const sellerPhone =
      ad?.SellerPhone ||
      ad?.SellerMobile ||
      ad?.mobileNo ||
      sellerSource?.phone ||
      sellerSource?.Phone ||
      sellerSource?.mobile ||
      'N/A';

    const sellerJoinedRaw =
      sellerSource?.createdAt ||
      sellerSource?.CreatedAt ||
      ad?.CreatedAt ||
      ad?.created_at ||
      null;

    const sellerJoinedDate = sellerJoinedRaw
      ? new Date(sellerJoinedRaw).toLocaleDateString()
      : 'N/A';

    const sellerInfo = {
      name: sellerName,
      email: sellerEmail,
      image: sellerImage,
      phone: sellerPhone,
      joinedDate: sellerJoinedDate,
    };

    const detailCards = [
      { label: 'Price', value: `Rs. ${parseInt(ad.VehiclePrice || 0).toLocaleString()}`, icon: '💰', highlight: true },
      { label: 'Year', value: ad.RegistrationYear || 'N/A', icon: '📅' },
      { label: 'Mileage', value: ad.VehicleMileage ? `${ad.VehicleMileage} km` : 'N/A', icon: '🛣️' },
      { label: 'Location', value: ad.LocationName || 'N/A', icon: '📍' },
      { label: 'Transmission', value: ad.Transmission || 'N/A', icon: '⚙️' },
      { label: 'Engine Type', value: ad.EngineType || 'N/A', icon: '🔧' },
      { label: 'Power', value: ad.VehiclePower || 'N/A', icon: '⚡' },
      { label: 'Body Type', value: getBodyTypeName(ad.VehicleBodyTypeID), icon: '🚗' },
      { label: 'Color', value: ad.Color || 'N/A', icon: '🎨' },
      { label: 'Load Capacity', value: ad.LoadCapacity || 'N/A', icon: '📦' },
      { label: 'Ownership', value: ad.Ownership || 'N/A', icon: '👤' },
      { label: 'Vehicle Type', value: ad.VehicleTypeName || ad.VehicleType || 'N/A', icon: '🏷️' },
    ];

    const visibleDetails = showAllDetails ? detailCards : detailCards.slice(0, 6);

    return (
      <div className="min-h-screen surface-primary">
        {/* Header */}
        <div className="surface-secondary border-b border-primary sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-2 text-secondary hover:text-primary transition-all duration-200 font-medium group"
              >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Ads</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <button className="p-2.5 text-tertiary hover:text-emov-purple transition-colors duration-200 hover:surface-tertiary rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="p-2.5 text-tertiary hover:text-emov-purple transition-colors duration-200 hover:surface-tertiary rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="surface-card rounded-xl shadow-theme overflow-hidden border border-primary">
                {/* Main Image */}
                <div className="relative h-80 sm:h-96 surface-tertiary">
                  <img
                    src={images[activeImageIndex]}
                    alt={ad.VehicleName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/mockvehicle.png';
                    }}
                  />
                  
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 surface-secondary rounded-full flex items-center justify-center shadow-theme hover:surface-primary transition-colors"
                      >
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 surface-secondary rounded-full flex items-center justify-center shadow-theme hover:surface-primary transition-colors"
                      >
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 surface-primary/90 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary">
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="p-4 border-t border-primary">
                    <div className="flex space-x-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            activeImageIndex === index 
                              ? 'border-emov-purple ring-2 ring-emov-purple/20' 
                              : 'border-primary hover:border-secondary'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${ad.VehicleName} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Title & Basic Info */}
              <div className="surface-card rounded-xl shadow-theme p-6 border border-primary">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
          {ad.VehicleName}
        </h1>
        <p className="text-lg text-secondary">
          {ad.BrandName} • {ad.ModelName} • {ad.RegistrationYear}
        </p>
        
     {/* Enhanced Badges Section */}
<div className="flex flex-wrap gap-3 mt-4">
  {/* Verified */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-400/50 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    <span className="text-sm font-semibold text-green-800 dark:text-green-300">Verified</span>
  </div>

  {/* Featured */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-400/50 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
    <span className="text-sm font-semibold text-red-800 dark:text-red-300">Featured</span>
  </div>

  {/* Dealer Maintained */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-400/50 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">Dealer Maintained</span>
  </div>

  {/* Warranty Available */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-400/50 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Warranty Available</span>
  </div>

  {/* Top Rated Seller */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-400/50 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Top Rated Seller</span>
  </div>
</div>
        
        <div className="text-xs text-gray-500 mt-2">
          {/* Existing content if any */}
        </div>
      </div>
      <div className="mt-3 sm:mt-0">
        <div className="text-3xl font-bold text-emov-purple">
          Rs. {parseInt(ad.VehiclePrice || 0).toLocaleString()}
        </div>
      </div>
    </div>
  </div>

             {/* Vehicle Specification Card */}
<div className="surface-card rounded-xl shadow-theme p-6 border border-primary">
  <h2 className="text-2xl font-bold text-primary mb-6">Vehicle Specifications</h2>
  
  {/* Main Card Details */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div className="p-4 surface-tertiary rounded-lg border border-primary">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-lg">🛣️</div>
        <p className="text-sm text-tertiary">Mileage</p>
      </div>
      <p className="text-lg font-semibold text-primary">
        {ad.VehicleMileage || 'N/A'}
      </p>
    </div>
    
    <div className="p-4 surface-tertiary rounded-lg border border-primary">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-lg">⚡</div>
        <p className="text-sm text-tertiary">Power</p>
      </div>
      <p className="text-lg font-semibold text-primary">{ad.VehiclePower || 'N/A'}</p>
    </div>
    
    <div className="p-4 surface-tertiary rounded-lg border border-primary">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-lg">⚙️</div>
        <p className="text-sm text-tertiary">Transmission</p>
      </div>
      <p className="text-lg font-semibold text-primary">{ad.Transmission || 'N/A'}</p>
    </div>
    
    <div className="p-4 surface-tertiary rounded-lg border border-primary">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-lg">📅</div>
        <p className="text-sm text-tertiary">Registration Year</p>
      </div>
      <p className="text-lg font-semibold text-primary">{ad.RegistrationYear || 'N/A'}</p>
    </div>
  </div>

  {/* Dropdown Sections */}
  <div className="space-y-4">
    
    {/* Service History */}
   {/* Service History */}
<div className="border border-primary rounded-lg overflow-hidden">
  <button
    onClick={() => toggleSection('serviceHistory')}
    className="w-full p-4 surface-secondary flex items-center justify-between hover:surface-tertiary transition-colors"
  >
    <span className="text-lg font-semibold text-primary">Service History</span>
    <svg 
      className={`w-5 h-5 text-emov-purple transition-transform ${expandedSections.serviceHistory ? 'rotate-180' : ''}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  
  {expandedSections.serviceHistory && (
    <div className="p-4 surface-primary border-t border-primary">
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
          <span className="text-tertiary">Year</span>
          <span className="font-medium text-primary">{ad.RegistrationYear || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
          <span className="text-tertiary">Mileage</span>
          <span className="font-medium text-primary">{ad.VehicleMileage || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
          <span className="text-tertiary">Transmission</span>
          <span className="font-medium text-primary">{ad.Transmission || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
          <span className="text-tertiary">Price</span>
          <span className="font-medium text-primary">
            {ad.VehiclePrice ? `Rs. ${parseInt(ad.VehiclePrice).toLocaleString()}` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-tertiary">Location</span>
          <span className="font-medium text-primary">{ad.LocationName || 'N/A'}</span>
        </div>
      </div>
    </div>
  )}
</div>

    {/* Powertrain & Specs */}
    <div className="border border-primary rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection('powertrainSpecs')}
        className="w-full p-4 surface-secondary flex items-center justify-between hover:surface-tertiary transition-colors"
      >
        <span className="text-lg font-semibold text-primary">Powertrain & Specs</span>
        <svg 
          className={`w-5 h-5 text-emov-purple transition-transform ${expandedSections.powertrainSpecs ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expandedSections.powertrainSpecs && (
        <div className="p-4 surface-primary border-t border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Engine Type</span>
              <span className="font-medium text-primary">{ad.EngineType || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Power</span>
              <span className="font-medium text-primary">{ad.VehiclePower || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Transmission</span>
              <span className="font-medium text-primary">{ad.Transmission || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Drivetrain</span>
              <span className="font-medium text-primary">{ad.Drivetrain || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-tertiary">Fuel Type</span>
              <span className="font-medium text-primary">{ad.FuelType || 'Diesel'}</span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Vehicle Condition */}
    <div className="border border-primary rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection('vehicleCondition')}
        className="w-full p-4 surface-secondary flex items-center justify-between hover:surface-tertiary transition-colors"
      >
        <span className="text-lg font-semibold text-primary">Vehicle Condition</span>
        <svg 
          className={`w-5 h-5 text-emov-purple transition-transform ${expandedSections.vehicleCondition ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expandedSections.vehicleCondition && (
        <div className="p-4 surface-primary border-t border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Overall Condition</span>
              <span className="font-medium text-primary">{ad.VehicleCondition || 'Excellent'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Inspection Status</span>
              <span className="font-medium text-primary">{ad.InspectionStatus || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Certification</span>
              <span className="font-medium text-primary">{ad.Certification || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-tertiary">Accident History</span>
              <span className="font-medium text-primary">{ad.AccidentHistory || 'No Accidents'}</span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Functional / Bodytype */}
    <div className="border border-primary rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection('functionalBodytype')}
        className="w-full p-4 surface-secondary flex items-center justify-between hover:surface-tertiary transition-colors"
      >
        <span className="text-lg font-semibold text-primary">Functional Details</span>
        <svg 
          className={`w-5 h-5 text-emov-purple transition-transform ${expandedSections.functionalBodytype ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expandedSections.functionalBodytype && (
        <div className="p-4 surface-primary border-t border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Bodytype</span>
              <span className="font-medium text-primary">{getBodyTypeName(ad.VehicleBodyTypeID)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Make and Model</span>
              <span className="font-medium text-primary">{ad.BrandName} {ad.ModelName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Load Capacity</span>
              <span className="font-medium text-primary">{ad.LoadCapacity || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-tertiary">Vehicle Type</span>
              <span className="font-medium text-primary">{ad.VehicleTypeName || ad.VehicleType || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Other Details */}
    <div className="border border-primary rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection('otherDetails')}
        className="w-full p-4 surface-secondary flex items-center justify-between hover:surface-tertiary transition-colors"
      >
        <span className="text-lg font-semibold text-primary">Other Details</span>
        <svg 
          className={`w-5 h-5 text-emov-purple transition-transform ${expandedSections.otherDetails ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expandedSections.otherDetails && (
        <div className="p-4 surface-primary border-t border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Color</span>
              <span className="font-medium text-primary">{ad.Color || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Ownership</span>
              <span className="font-medium text-primary">{ad.Ownership || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-primary/20 last:border-b-0">
              <span className="text-tertiary">Registration Year</span>
              <span className="font-medium text-primary">{ad.RegistrationYear || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-tertiary">Location</span>
              <span className="font-medium text-primary">{ad.LocationName || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

              {/* Seller Information */}
              {/* <div className="surface-card rounded-xl shadow-theme p-6 border border-primary">
                <h2 className="text-xl font-bold text-primary mb-6">Seller Information</h2>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                
                  {renderSellerAvatar(sellerInfo)}
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary mb-1">{sellerInfo.name}</h3>
                    <p className="text-sm text-secondary mb-3">Member since {sellerInfo.joinedDate}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-emov-purple mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${sellerInfo.email}`} className="text-emov-purple hover:underline">
                          {sellerInfo.email}
                        </a>
                      </div>
                      
                      {sellerInfo.phone && sellerInfo.phone !== 'N/A' && (
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-emov-purple mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a href={`tel:${sellerInfo.phone}`} className="text-emov-purple hover:underline">
                            {sellerInfo.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleContactSeller}
                      className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-emov-purple text-white rounded-lg hover:bg-emov-purple/90 transition-colors duration-200 font-medium"
                    >
                      Contact Seller
                    </button>
                  </div>
                </div>
              </div> */}

              {/* Description */}
              <div className="surface-card rounded-xl shadow-theme p-6 border border-primary">
                <h2 className="text-xl font-bold text-primary mb-4">Vehicle Description</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-secondary leading-relaxed mb-4">
                    This {ad.VehicleName} is meticulously maintained and ready for its next journey. 
                    With its powerful performance and excellent condition, it represents outstanding value 
                    in today's market.
                  </p>
                  
                  {ad.SellerComment && (
                    <div className="surface-primary rounded-lg p-5 border border-emov-purple/20">
                      <h3 className="font-semibold text-emov-purple mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Seller's Notes
                      </h3>
                      <p className="text-secondary italic">"{ad.SellerComment}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Description */}
              {ad.AudioURL && (
                <div className="surface-card rounded-xl shadow-theme p-6 border border-primary">
                  <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Audio Description
                  </h2>
                  <div className="surface-primary rounded-lg p-4 border border-emov-purple/20">
                    <audio 
                      controls 
                      className="w-full"
                      preload="metadata"
                    >
                      <source 
                        src={ad.AudioURL.startsWith('http') ? ad.AudioURL : `https://api.emov.com.pk/audio/${ad.AudioURL}`} 
                        type="audio/wav" 
                      />
                      <source 
                        src={ad.AudioURL.startsWith('http') ? ad.AudioURL : `https://api.emov.com.pk/audio/${ad.AudioURL}`} 
                        type="audio/mp3" 
                      />
                      Your browser does not support the audio element.
                    </audio>
                    <p className="text-sm text-tertiary mt-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Listen to the seller's audio description of this vehicle
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column - Sidebar */}
            <div className="w-full lg:w-80 xl:w-96">
              {/* Price & Actions Card */}
              {/* <div className="surface-card rounded-xl mb-4 shadow-theme p-6 border border-primary sticky top-24 h-fit z-40">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-emov-purple mb-2">
                    Rs. {parseInt(ad?.VehiclePrice || 0).toLocaleString()}
                  </div>
                  <p className="text-tertiary text-sm">Negotiable</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleContactSeller}
                    disabled={chatLoading}
                    className="w-full bg-emov-purple text-white py-4 rounded-lg font-semibold hover:bg-emov-purple/90 transition-all duration-200 shadow-theme flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chatLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Chat with Seller</span>
                      </>
                    )}
                  </button>
                  
                  <button className="w-full surface-primary border-2 border-emov-purple text-emov-purple py-4 rounded-lg font-semibold hover:surface-secondary transition-all duration-200">
                    💰 Make Offer
                  </button>
                  
                  <button className="w-full surface-tertiary border border-primary text-secondary py-3 rounded-lg font-medium hover:surface-primary transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span>❤️ Save Ad</span>
                  </button>
                </div>
              </div> */}

            {/* Enhanced Seller Information Card */}
<div className="bg-bg-secondary rounded-2xl shadow-xl border border-border-primary p-6 lg:p-8 mb-8">
  <h3 className="text-2xl font-bold text-text-primary mb-8 flex items-center gap-3">
    <svg className="w-8 h-8 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    Seller Information
  </h3>

  {/* Avatar + Name + Rating */}
  <div className="flex flex-col items-center text-center mb-8">
    <div className="relative mb-6">
      {renderSellerAvatar(sellerInfo, 'w-32 h-32', 'text-4xl')}
      {/* Optional: Online indicator */}
      <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-bg-secondary shadow-lg"></div>
    </div>

    <h4 className="text-2xl font-bold text-text-primary mb-2">{sellerInfo.name}</h4>

    {/* Rating */}
    <div className="flex items-center gap-2 mb-3">
      <div className="flex text-yellow-500">
        {'★★★★★'}
      </div>
      <span className="text-lg font-semibold text-text-primary">4.9</span>
      <span className="text-text-secondary">(124 reviews)</span>
    </div>

    {/* Member Since */}
    <p className="text-text-secondary text-sm">
      Member since {sellerInfo.joinedDate}
    </p>
  </div>

  {/* Contact Details */}
  <div className="space-y-4 mb-8">
    {/* Email */}
    <div className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary hover:border-emov-purple/50 transition-all">
      <div className="w-12 h-12 bg-emov-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-emov-purple" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-secondary">Email</p>
        <p className="font-semibold text-text-primary truncate">{sellerInfo.email}</p>
      </div>
    </div>

    {/* Location */}
    <div className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary hover:border-emov-purple/50 transition-all">
      <div className="w-12 h-12 bg-emov-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-secondary">Location</p>
        <p className="font-semibold text-text-primary">{ad.LocationName || 'Not specified'}</p>
      </div>
    </div>

    {/* Phone - Hidden until chat starts */}
    <div className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary opacity-70">
      <div className="w-12 h-12 bg-emov-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-secondary">Phone Number</p>
        <p className="font-medium text-text-primary italic">Available after starting chat</p>
      </div>
    </div>
  </div>

  {/* Chat Button */}
  <button
    onClick={handleContactSeller}
    disabled={chatLoading}
    className="w-full bg-emov-purple hover:bg-emov-purple-dark text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
  >
    {chatLoading ? (
      <>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        <span>Connecting...</span>
      </>
    ) : (
      <>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Chat with Seller</span>
      </>
    )}
  </button>
</div>

              {/* Safety Tips */}
              <div className="surface-card rounded-xl shadow-theme p-6 border border-primary">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emov-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Safety First
                </h3>
                <ul className="space-y-3 text-sm">
                  {[
                    "Meet in safe, public locations",
                    "Inspect vehicle thoroughly before payment",
                    "Verify all documentation and ownership",
                    "Avoid advance payments without inspection",
                    "Trust your instincts - if it seems too good to be true, it probably is"
                  ].map((tip, index) => (
                    <li key={index} className="flex items-start text-secondary">
                      <svg className="w-4 h-4 mr-3 mt-0.5 text-emov-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Report Button */}
              <button className="w-full text-center text-tertiary hover:text-red-500 transition-colors duration-200 py-3 flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Report this ad</span>
              </button>
            </div>
          </div>
        </div>

      {/* Chat Loading Overlay */}
      {chatLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-emov-purple/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emov-purple rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Sending message...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we connect you with the seller</p>
          </div>
        </div>
      )}
      </div>
    );
  };

  export default AdDetail;
