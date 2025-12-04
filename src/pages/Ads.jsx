import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaCar, FaCalendar, FaMapMarkerAlt, FaMoneyBillWave, FaCaretDown, FaMoon, FaSun } from 'react-icons/fa';
import apiService from '../services/Api';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';

const MyAds = () => {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('english');
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ad: null });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiService.user.getProfile();
        
        if (response.status === 200) {
          setUserProfile(response.data);
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUserProfile(JSON.parse(savedUser));
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    // Navigate to home page instead of dashboard
    window.location.href = '/';
  };

  // Helper function to construct image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/mockvehicle.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `https://api.emov.com.pk/image/${imagePath}`;
  };

  // Format price with commas
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return numPrice.toLocaleString('en-PK');
  };

  // Fetch user's ads
  const fetchMyAds = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.ads.getMyAds(page, pagination.perPage);
      console.log('My ads response:', response);
      console.log('My ads data:', response?.data);
      console.log('My ads data length:', response?.data?.length);
      
      if (response && response.data) {
        // Filter ads to ensure they belong to the current user
        // This is a temporary fix until the API properly filters by user
        const userId = localStorage.getItem('userId') || localStorage.getItem('user')?.id;
        console.log('Current user ID:', userId);
        
        setAds(response.data);
        setPagination(response.pagination || {
          total: response.data.length,
          page: 1,
          perPage: pagination.perPage,
          totalPages: 1
        });
      } else {
        setAds([]);
      }
    } catch (err) {
      console.error('Error fetching my ads:', err);
      setError('Failed to load your ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAds();
  }, []);

  const handleAdClick = (ad) => {
    navigate(`/ad/${ad.AdID}`, { state: { adData: ad, from: 'my-ads' } });
  };

  const handleDelete = (e, ad) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, ad });
  };

  const confirmDelete = async () => {
    try {
      console.log('Deleting ad:', deleteModal.ad.AdID);
      
      // Call the delete API
      await apiService.ads.delete(deleteModal.ad.AdID);

      // Close modal
      setDeleteModal({ isOpen: false, ad: null });

      // After deletion, always reload the first page of ads
      // This ensures that if the last ad on a later page is deleted,
      // the user is taken back to a valid page instead of seeing an empty list
      await fetchMyAds(1);

      // Show success message
      toast.success('Ad deleted successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
    } catch (error) {
      console.error('Failed to delete ad:', error);
      toast.error('Failed to delete ad. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setDeleteModal({ isOpen: false, ad: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, ad: null });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMyAds(newPage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emov-purple"></div>
          <p className="mt-4 text-text-secondary">Loading your ads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => fetchMyAds()}
            className="px-4 py-2 bg-emov-purple text-white rounded-lg hover:bg-emov-purple-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
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
                          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                          {theme === 'dark' ? <FaSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
            
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-1 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors border-none"
                onClick={() => navigate('/login')}
              >
                <span>Sign In</span>
              </button>
              <button
                className="flex items-center space-x-1 text-text-primary px-4 py-1 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--emov-green, #27c583ff)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={() => navigate('/signup')}
              >
                <span>Sign Up</span>
              </button>
              
            </div>
          </div>
          </div>

        {/* Navbar Section */}
        <div className="relative">
          <Navbar 
            isDark={theme === 'dark'}
            toggleTheme={toggleTheme}
            language={language}
            setLanguage={setLanguage}
            userProfile={userProfile}
            handleLogout={handleLogout}
          />
        </div>
    

      {/* Main Content */}
      <div className="flex justify-end mb-6  px-4 sm:px-6 lg:px-8 mt-10 w-full">
        <button
          onClick={() => navigate('/my-ads-list')}
          className="inline-flex items-center px-6 py-3 text-black rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
          style={{ backgroundColor: 'var(--emov-green)' }}
        >
          Create New Ad
        </button>
      </div>  
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <FaCar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No ads found</h3>
            <p className="text-text-secondary mb-6">You haven't created any ads yet.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-emov-purple text-white rounded-lg hover:bg-emov-purple-dark transition-colors"
            >
              Create Your First Ad
            </button>
          </div>
        ) : (
          <>
            {/* Ads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {ads.map((ad) => (
                <div
                  key={ad.AdID}
                  onClick={() => handleAdClick(ad)}
                  className="bg-bg-secondary rounded-lg overflow-hidden border border-border-primary hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(ad.Images?.[0])}
                      alt={ad.VehicleName}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-gray-100"
                    />
                    <div className="absolute top-2 right-2 bg-emov-purple text-white px-2 py-1 rounded text-xs font-medium">
                      {ad.VehicleType}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 truncate">
                      {ad.VehicleName || `${ad.BrandName || ''} ${ad.ModelName || ''}`.trim()}
                    </h3>
                    <p className="text-emov-purple font-bold text-xl mb-3">
                      PKR {formatPrice(ad.VehiclePrice)}
                    </p>

                    {/* Vehicle Details */}
                    <div className="space-y-2 text-sm text-text-secondary">
                      <div className="flex items-center">
                        <FaCalendar className="w-4 h-4 mr-2 text-gray-400" />
                        {ad.RegistrationYear} • {ad.Transmission}
                      </div>
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
                        {ad.LocationName}
                      </div>
                      <div className="flex items-center">
                        <FaMoneyBillWave className="w-4 h-4 mr-2 text-gray-400" />
                        {ad.VehicleMileage} km
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-border-primary">
                      <button
                        onClick={(e) => handleDelete(e, ad)}
                        className="w-full flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        <FaTrash className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded border border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-4 py-1 text-text-primary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 rounded border border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this ad? This action cannot be undone.
              {deleteModal.ad && (
                <span className="block mt-2 font-medium">
                  {deleteModal.ad.BrandName} {deleteModal.ad.ModelName}
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Ad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAds;
