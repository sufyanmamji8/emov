// src/pages/FilteredVehicles.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import apiService, { api } from '../services/Api';

const FilteredVehicles = () => {
  const { filterType, filterId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [error, setError] = useState(null);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const nameFromUrl = searchParams.get('name');
      setFilterName(decodeURIComponent(nameFromUrl || ''));

      let apiParams = {};
      
      console.log('Filter Type:', filterType);
      console.log('Filter ID:', filterId);
      
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

      console.log('API Params:', apiParams);

      console.log('[FilteredVehicles] Fetching ads with params:', apiParams);
      
      // Use the api instance which handles X-PLATFORM: WEB header for unauthorized requests
      const response = await api.get('/ads', { params: apiParams });

      console.log('API Response:', response.data);
      
      if (response.data && response.data.data) {
        setAds(response.data.data);
      } else {
        setAds([]);
        setError('No ads found for this filter');
      }
      
    } catch (error) {
      console.error('Error fetching ads:', error);
      
      if (error.response && error.response.status === 401) {
        console.log('401 Unauthorized - Clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        // Don't redirect automatically - let the components handle it
        return;
      }
      
      if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        setError('Network error: Could not connect to server. Please check your connection.');
      } else {
        setError('Failed to load ads. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterId, searchParams, navigate]);

  useEffect(() => {
    if (filterType && filterId) {
      fetchAds();
    } else {
      setLoading(false);
      setError('Missing filter parameters');
    }
  }, [filterType, filterId, fetchAds]);

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
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emov-purple"></div>
        <p className="ml-4 text-text-primary">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-emov-purple hover:text-purple-700 font-medium"
          >
            ← Back to Dashboard
          </button>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            {formatFilterType(filterType)}: {filterName}
          </h1>
          
          <p className="text-text-secondary">
            {ads.length} {ads.length === 1 ? 'vehicle found' : 'vehicles found'}
          </p>
        </div>

        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <strong>Authentication Required:</strong> {error}
            <br />
            <small>You need to be logged in to view these vehicles.</small>
            <div className="mt-3">
              <button 
                onClick={handleLoginRedirect}
                className="px-4 py-2 bg-emov-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Login to Continue
              </button>
            </div>
          </div>
        )}

        {ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad) => {
              const imageUrl = ad.Images && ad.Images.length > 0 
                ? `https://api.emov.com.pk/image/${ad.Images[0]}`
                : '/mockvehicle.png';

              return (
                <div
                  key={ad.AdID}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-border-primary"
                  onClick={() => handleAdClick(ad)}
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={ad.VehicleName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/mockvehicle.png';
                      }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-text-primary line-clamp-1 mb-2">
                      {ad.VehicleName}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emov-purple font-bold text-lg">
                        {formatPrice(ad.VehiclePrice)}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {ad.RegistrationYear}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-text-secondary mb-2">
                      <span>{ad.BrandName}</span>
                      <span>{ad.VehicleMileage} km</span>
                    </div>
                    
                    {ad.LocationName && (
                      <p className="text-text-secondary text-sm line-clamp-1">
                        📍 {ad.LocationName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No vehicles found
            </h3>
            <p className="text-text-secondary mb-6">
              No vehicles match your selected filter criteria.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-emov-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Back to Browse Vehicles
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FilteredVehicles;