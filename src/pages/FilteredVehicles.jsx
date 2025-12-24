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
      switch (filterType) {
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
        response = await api.get('/ads', { params: apiParams, timeout: 30000 });
      } catch {
        try {
          response = await api.get('/vehicles', { params: apiParams, timeout: 30000 });
        } catch {
          response = await api.get('/vehiclesfilter', { params: apiParams, timeout: 30000 });
        }
      }

      if (response?.data?.data) {
        setAds(response.data.data);
        setFilteredAds(response.data.data);
      } else {
        setAds([]);
        setFilteredAds([]);
        setError('No vehicles found for this filter');
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
        return;
      }
      setError(
        error.response
          ? `Server error: ${error.response.status}`
          : error.code === 'ECONNABORTED'
          ? 'Request timed out. Please try again.'
          : 'Failed to load vehicles. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [filterType, filterId, searchParams, navigate]);

  useEffect(() => {
    if (filterType && filterId) fetchAds();
  }, [filterType, filterId, fetchAds]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAds(ads);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = ads.filter(
      (ad) =>
        ad.VehicleName?.toLowerCase().includes(lowerQuery) ||
        ad.BrandName?.toLowerCase().includes(lowerQuery) ||
        ad.LocationName?.toLowerCase().includes(lowerQuery)
    );
    setFilteredAds(filtered);
  }, [searchQuery, ads]);

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `PKR ${parseFloat(price).toLocaleString('en-PK')}`;
  };

  const handleAdClick = (ad) => {
    navigate(`/ad/${ad.AdID}`, { state: { adData: ad } });
  };

  // Perfectly centered loader (already fixed in previous version)
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-8 border-bg-tertiary border-t-emov-purple animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaCar className="w-12 h-12 text-emov-purple" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">Loading vehicles...</h3>
          <p className="text-lg text-text-secondary">Finding the best matches for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sticky Header with PERFECTLY CENTERED Title */}
      <div className="bg-bg-secondary border-b border-border-primary sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative">
          {/* Back Button - Left */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 text-text-primary hover:text-emov-purple transition-colors font-medium z-10"
          >
            <FaArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Centered Title - Always visible and perfectly centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary whitespace-nowrap">
              {filterName || 'Filtered Vehicles'}
            </h1>
          </div>

          {/* Right Side: Search + Count */}
          <div className="flex items-center justify-end gap-4 ml-auto">
            {/* Search Input (expands on click) */}
            <div className={`transition-all duration-300 ${searchOpen ? 'w-64 sm:w-80' : 'w-0'} overflow-hidden`}>
              {searchOpen && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border border-border-primary rounded-xl focus:border-emov-purple focus:outline-none focus:ring-2 focus:ring-emov-purple/30 transition-all"
                    autoFocus
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-emov-purple"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Search Toggle Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                searchOpen ? 'bg-emov-purple text-white' : 'bg-bg-tertiary hover:bg-bg-secondary'
              }`}
            >
              <FaSearch className="w-5 h-5" />
            </button>

            {/* Results Count (Desktop only) */}
            <div className="hidden sm:flex items-center gap-2 bg-bg-tertiary px-4 py-2 rounded-xl border border-border-primary">
              <div className="w-2 h-2 bg-emov-purple rounded-full animate-pulse"></div>
              <span className="font-medium text-text-primary">
                {filteredAds.length} {filteredAds.length === 1 ? 'vehicle' : 'vehicles'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Banner */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-bg-secondary rounded-2xl shadow-xl p-8 border border-border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emov-purple/5 rounded-full blur-3xl -z-0"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-emov-purple rounded-2xl flex items-center justify-center shadow-lg">
                <FaFilter className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-emov-purple uppercase tracking-wider">
                  {filterType?.replace('-', ' ') || 'Filter'}
                </span>
                <h1 className="text-3xl font-bold text-text-primary mt-1 mb-2">
                  {filterName || 'All Vehicles'}
                </h1>
                <p className="text-text-secondary">
                  Showing {filteredAds.length} of {ads.length} available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-500 text-red-800 p-6 rounded-xl shadow-md">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Vehicle Grid */}
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {filteredAds.map((ad) => {
              const imageUrl =
                ad.Images?.[0]
                  ? `https://api.emov.com.pk/image/${ad.Images[0]}`
                  : '/mockvehicle.png';

              return (
                <div
                  key={ad.AdID}
                  onClick={() => handleAdClick(ad)}
                  className="bg-bg-secondary rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-border-primary group"
                >
                  <div className="relative h-56 bg-gray-50 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={ad.VehicleName || `${ad.BrandName} ${ad.ModelName}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => (e.target.src = '/mockvehicle.png')}
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-md">
                      {ad.RegistrationYear || 'N/A'}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-emov-purple transition-colors">
                      {ad.VehicleName || `${ad.BrandName} ${ad.ModelName}`.trim()}
                    </h3>

                    <div className="text-2xl font-bold text-emov-purple mb-4">
                      {formatPrice(ad.VehiclePrice)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <FaCar className="w-4 h-4 text-emov-purple/70" />
                        <span className="truncate">{ad.BrandName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaTachometerAlt className="w-4 h-4 text-emov-purple/70" />
                        <span>{ad.VehicleMileage?.toLocaleString() || 'N/A'} km</span>
                      </div>
                    </div>

                    {ad.LocationName && (
                      <div className="mt-4 pt-4 border-t border-border-primary/50 flex items-center gap-2 text-sm text-text-secondary">
                        <FaMapMarkerAlt className="w-4 h-4 text-emov-purple/70" />
                        <span className="truncate">{ad.LocationName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <FaCar className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-text-primary mb-3">
              {searchQuery ? 'No matching vehicles' : 'No vehicles found'}
            </h3>
            <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords.`
                : 'No vehicles match this filter. Check back later!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-8 py-4 bg-bg-secondary rounded-xl hover:bg-bg-tertiary transition-colors font-medium"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-emov-purple text-white rounded-xl hover:bg-emov-purple-dark transition-colors shadow-md font-medium"
              >
                Browse All Vehicles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilteredVehicles;