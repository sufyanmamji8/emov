// src/pages/FilteredVehicles.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaSearch, FaArrowLeft, FaFilter, FaTimes, FaMapMarkerAlt, FaCar, FaTachometerAlt } from 'react-icons/fa';
import apiService, { api } from '../services/Api';

const FilteredVehicles = () => {
  const { filterType, filterId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [error, setError] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAds, setFilteredAds] = useState([]);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const nameFromUrl = searchParams.get('name');
      setFilterName(decodeURIComponent(nameFromUrl || ''));

      let apiParams = {};
      
      switch(filterType) {
        case 'category':
          apiParams = { type: filterId };
          break;
        case 'budget':
          apiParams = { budget: filterId };
          break;
        case 'brand':
          apiParams = { brand: filterId };
          break;
        case 'model':
          apiParams = { model: filterId };
          break;
        case 'body-type':
          apiParams = { bodyType: filterId };
          break;
        default:
          break;
      }
      
      let response;
      try {
        response = await api.get('/ads', { 
          params: apiParams,
          timeout: 30000
        });
      } catch (firstError) {
        try {
          response = await api.get('/vehicles', { 
            params: apiParams,
            timeout: 30000
          });
        } catch (secondError) {
          response = await api.get('/vehiclesfilter', { 
            params: apiParams,
            timeout: 30000
          });
        }
      }
      
      if (response.data && response.data.data) {
        setAds(response.data.data);
        setFilteredAds(response.data.data);
      } else {
        setAds([]);
        setFilteredAds([]);
        setError('No ads found for this filter');
      }
      
    } catch (error) {
      console.error('Error fetching ads:', error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        return;
      }
      
      if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
          setError('Request timeout. Please check your connection and try again.');
        } else {
          setError('Network error: Could not connect to server. Please check your internet connection.');
        }
      } else {
        setError('Failed to load ads. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterId, searchParams]);

  useEffect(() => {
    if (filterType && filterId) {
      fetchAds();
    } else {
      setLoading(false);
      setError('Missing filter parameters');
    }
  }, [filterType, filterId, fetchAds]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = ads.filter(ad => 
        ad.VehicleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.BrandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.LocationName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAds(filtered);
    } else {
      setFilteredAds(ads);
    }
  }, [searchQuery, ads]);

  const formatFilterType = (type) => {
    const typeMap = {
      'category': 'Category',
      'budget': 'Budget', 
      'brand': 'Brand',
      'model': 'Model',
      'body-type': 'Body Type'
    };
    return typeMap[type] || type;
  };

  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    return `Rs. ${parseFloat(price).toLocaleString()}`;
  };

  const handleAdClick = (ad) => {
    navigate(`/ad/${ad.AdID}`, { state: { adData: ad } });
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

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

  return (
    <div className="min-h-screen surface-primary">
      {/* Enhanced Professional Header with Smooth Search */}
      <div className="surface-secondary border-b border-primary sticky top-0 z-40 backdrop-blur-md bg-bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-secondary hover:text-primary transition-all duration-300 font-medium group px-3 py-2 rounded-lg hover:bg-bg-secondary"
            >
              <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            {/* Centered Heading - Hidden when search is open on mobile */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ${searchOpen ? 'opacity-0 sm:opacity-100' : 'opacity-100'}`}>
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap">
                Filtered Vehicles
              </h1>
            </div>
            
            {/* Search Container with Smooth Animation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative">
                <div 
                  className={`flex items-center justify-center transition-all duration-500 ease-out ${
                    searchOpen 
                      ? 'bg-bg-secondary border-2 border-emov-purple/30 rounded-xl px-3 sm:px-4 py-2.5 shadow-lg w-[200px] sm:w-[280px] md:w-[320px]' 
                      : 'w-10 h-10 sm:w-11 sm:h-11 bg-bg-secondary hover:bg-bg-tertiary border-2 border-border-primary hover:border-emov-purple/30 rounded-xl shadow-md hover:shadow-lg cursor-pointer'
                  }`}
                  onClick={() => !searchOpen && setSearchOpen(true)}
                >
                  {/* Search Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (searchOpen && searchQuery) {
                        // If search is open and has query, clicking icon searches
                        return;
                      }
                      setSearchOpen(!searchOpen);
                    }}
                    className={`flex items-center justify-center transition-all duration-300 ${
                      searchOpen ? 'p-0' : 'w-full h-full'
                    }`}
                  >
                    <FaSearch className={`transition-all duration-300 ${
                      searchOpen 
                        ? 'w-4 h-4 text-emov-purple' 
                        : 'w-4 h-4 sm:w-5 sm:h-5 text-text-secondary group-hover:text-emov-purple'
                    }`} />
                  </button>
                  
                  {/* Input Field - Smooth Fade In */}
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-transparent border-none outline-none text-text-primary placeholder-text-secondary flex-1 ml-2 text-sm font-medium transition-all duration-300 ${
                      searchOpen ? 'opacity-100 w-full' : 'opacity-0 w-0 pointer-events-none'
                    }`}
                    autoFocus={searchOpen}
                  />
                  
                  {/* Close Button - Smooth Fade In */}
                  {searchOpen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="ml-2 text-text-secondary hover:text-emov-purple transition-all duration-300 p-1 rounded-full hover:bg-bg-tertiary"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Results Count Badge */}
              <div className="hidden sm:flex items-center space-x-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-primary">
                <div className="w-2 h-2 bg-emov-purple rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-text-primary">
                  {filteredAds.length} {filteredAds.length === 1 ? 'vehicle' : 'vehicles'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Filter Info Card */}
        <div className="surface-card rounded-2xl shadow-xl p-6 sm:p-8 border border-primary mb-8 bg-gradient-to-br from-bg-primary to-bg-secondary relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emov-purple/5 rounded-full blur-3xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emov-purple to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <FaFilter className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-emov-purple uppercase tracking-wider">
                    {formatFilterType(filterType)}
                  </span>
                  <div className="h-1 w-1 bg-text-secondary rounded-full"></div>
                  <span className="text-xs sm:text-sm text-text-secondary">Active Filter</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {filterName}
                </h1>
                <p className="text-secondary text-sm sm:text-base">
                  Showing {filteredAds.length} of {ads.length} {ads.length === 1 ? 'vehicle' : 'vehicles'} available
                </p>
              </div>
            </div>
            
            {/* Search Active Indicator */}
            {searchQuery && (
              <div className="mt-4 pt-4 border-t border-border-primary">
                <div className="flex items-center space-x-2">
                  <FaSearch className="w-4 h-4 text-emov-purple" />
                  <span className="text-sm text-text-secondary">
                    Search results for: <span className="font-semibold text-text-primary">"{searchQuery}"</span>
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-auto text-xs text-emov-purple hover:text-purple-700 font-medium transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-800 px-6 py-4 rounded-xl mb-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Authentication Required</h3>
                <p className="text-sm mb-3">{error}</p>
                <small className="block mb-4">You need to be logged in to view these vehicles.</small>
                <button 
                  onClick={handleLoginRedirect}
                  className="px-5 py-2.5 bg-emov-purple text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Login to Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Vehicle Grid */}
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredAds.map((ad) => {
              const imageUrl = ad.Images && ad.Images.length > 0 
                ? `https://api.emov.com.pk/image/${ad.Images[0]}`
                : '/mockvehicle.png';

              return (
                <div
                  key={ad.AdID}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer border border-border-primary hover:border-emov-purple/50 transform hover:-translate-y-2"
                  onClick={() => handleAdClick(ad)}
                >
                  {/* Image Container with Overlay */}
                  <div className="relative h-48 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={ad.VehicleName}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/mockvehicle.png';
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Year Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-lg">
                      {ad.RegistrationYear}
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4 sm:p-5">
                    {/* Vehicle Name */}
                    <h3 className="font-bold text-lg text-text-primary line-clamp-1 mb-3 group-hover:text-emov-purple transition-colors duration-300">
                      {ad.VehicleName}
                    </h3>
                    
                    {/* Price */}
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-emov-purple font-bold text-xl">
                        {formatPrice(ad.VehiclePrice)}
                      </span>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <FaCar className="w-4 h-4 text-emov-purple/70" />
                        <span className="truncate">{ad.BrandName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <FaTachometerAlt className="w-4 h-4 text-emov-purple/70" />
                        <span>{ad.VehicleMileage} km</span>
                      </div>
                    </div>
                    
                    {/* Location */}
                    {ad.LocationName && (
                      <div className="flex items-center space-x-2 text-sm text-text-secondary pt-3 border-t border-gray-100">
                        <FaMapMarkerAlt className="w-3 h-3 text-emov-purple/70" />
                        <span className="line-clamp-1">{ad.LocationName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !error ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="inline-block p-6 bg-gradient-to-br from-emov-purple/10 to-purple-600/10 rounded-full">
                <FaCar className="w-16 h-16 text-emov-purple" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">
              {searchQuery ? 'No vehicles match your search' : 'No vehicles found'}
            </h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              {searchQuery 
                ? `We couldn't find any vehicles matching "${searchQuery}". Try adjusting your search.`
                : 'There are no vehicles available for this filter. Check back later for new listings!'
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-bg-secondary text-text-primary rounded-xl hover:bg-bg-tertiary transition-all duration-300 font-medium border border-border-primary"
                >
                  Clear Search
                </button>
              )}
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-emov-purple to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium transform hover:-translate-y-0.5"
              >
                Browse All Vehicles
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FilteredVehicles;