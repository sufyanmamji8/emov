import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/Api';

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

  // Fetch filter data to get body type names
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const response = await apiService.vehicles.getFilters();
        setFilterData(response);
      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    };
    fetchFilterData();
  }, []);

  const getBodyTypeName = (bodyTypeId) => {
    if (!bodyTypeId && bodyTypeId !== 0) return 'N/A';
    const id = String(bodyTypeId);
    const bodyTypesData = filterData?.body_type || filterData?.bodyType || [];
    
    if (bodyTypesData.length > 0) {
      const bodyType = bodyTypesData.find(bt => 
        String(bt.BodyTypeID || bt.id) === id
      );
      return bodyType?.BodyTypeName || bodyType?.name || 'N/A';
    }
    return 'N/A';
  };

  useEffect(() => {
    const loadAdData = async () => {
      try {
        setLoading(true);
        console.log('Fetching ad details for ID:', adId);
        const response = await apiService.ads.getById(adId);
        const adData = response.data || response;
        
        if (adData) {
          setAd(adData);
        } else {
          setError('Ad not found');
        }
      } catch (err) {
        console.error('Error loading ad details:', err);
        setError('Failed to load ad details');
      } finally {
        setLoading(false);
      }
    };

    if (adId) {
      loadAdData();
    }
  }, [adId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleContactSeller = () => {
    alert('Contact seller functionality would be implemented here');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emov-purple border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ad Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The ad you are looking for does not exist or has been removed.'}</p>
          <button
            onClick={handleGoBack}
            className="px-8 py-3 bg-emov-purple text-white rounded-xl font-semibold hover:bg-emov-purple/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go Back to Ads
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-emov-purple dark:hover:text-emov-purple transition-all duration-200 font-medium group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Ads</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button className="p-2.5 text-gray-400 hover:text-emov-purple transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-2.5 text-gray-400 hover:text-emov-purple transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Enhanced Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Main Image */}
              <div className="relative h-80 sm:h-96 bg-gray-100 dark:bg-gray-900">
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          activeImageIndex === index 
                            ? 'border-emov-purple ring-2 ring-emov-purple/20' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {ad.VehicleName}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {ad.VehicleBrand} • {ad.VehicleModel} • {ad.RegistrationYear}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <div className="text-3xl font-bold text-emov-purple bg-gradient-to-r from-emov-purple to-emov-green bg-clip-text text-transparent">
                    Rs. {parseInt(ad.VehiclePrice || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Vehicle Details Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Specifications</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{visibleDetails.length} of {detailCards.length} specs</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleDetails.map((detail, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      detail.highlight
                        ? 'bg-gradient-to-br from-emov-purple/5 to-emov-green/5 border-emov-purple/20'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">{detail.icon}</div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{detail.label}</p>
                        <p className={`font-semibold ${
                          detail.highlight 
                            ? 'text-emov-purple text-lg' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {detail.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {detailCards.length > 6 && (
                <button
                  onClick={() => setShowAllDetails(!showAllDetails)}
                  className="w-full mt-6 py-3 text-emov-purple font-semibold rounded-xl border border-emov-purple/20 hover:bg-emov-purple/5 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>{showAllDetails ? 'Show Less' : `View All ${detailCards.length} Specifications`}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showAllDetails ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Enhanced Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vehicle Description</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  This {ad.VehicleName} is meticulously maintained and ready for its next journey. 
                  With its powerful performance and excellent condition, it represents outstanding value 
                  in today's market.
                </p>
                
                {ad.SellerComment && (
                  <div className="bg-gradient-to-r from-emov-purple/5 to-emov-green/5 rounded-xl p-5 border border-emov-purple/20">
                    <h3 className="font-semibold text-emov-purple mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Seller's Notes
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 italic">"{ad.SellerComment}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Price & Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24 lg:top-28">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-emov-purple mb-2">
                  Rs. {parseInt(ad.VehiclePrice || 0).toLocaleString()}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Negotiable</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-gradient-to-r from-emov-purple to-emov-green text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
                >
                  📞 Contact Seller
                </button>
                
                <button className="w-full bg-white dark:bg-gray-700 border-2 border-emov-purple text-emov-purple py-4 rounded-xl font-semibold hover:bg-emov-purple/5 transition-all duration-200">
                  💰 Make Offer
                </button>
                
                <button className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors duration-200 flex items-center justify-center space-x-2">
                  <span>❤️ Save Ad</span>
                </button>
              </div>
            </div>

            {/* Enhanced Seller Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Seller Information
              </h3>
              
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emov-purple to-emov-green rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {(ad.SellerName || ad.UserName || 'PS').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{ad.SellerName || ad.UserName || 'Private Seller'}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">⭐ 4.8 • Member since {ad.MemberSince || '2020'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 mr-3 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">{ad.Phone || ad.ContactNumber || 'Contact for details'}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 mr-3 text-emov-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{ad.LocationName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Safety Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-emov-purple/10 dark:from-blue-900/20 dark:to-emov-purple/5 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <li key={index} className="flex items-start text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 mr-3 mt-0.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Report Button */}
            <button className="w-full text-center text-gray-400 hover:text-red-500 transition-colors duration-200 py-3 flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Report this ad</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetail;