import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaCar, FaCalendar, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';
import apiService from '../services/Api';
import Navbar from '../components/Layout/Navbar';
import MobileBottomNav from '../components/Layout/MobileBottomNav';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useUserProfile } from '../hooks/useUserProfile';
import Header from '../components/Layout/Header';
import toast from 'react-hot-toast'; // assuming you're using react-hot-toast

// Language translations
const translations = {
  english: {
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
    adDeletedSuccessfully: "Ad deleted successfully!",
    failedToDeleteAd: "Failed to delete ad. Please try again."
  },
  urdu: {
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
    adDeletedSuccessfully: "اشتہار کامیابی سے حذف ہو گیا!",
    failedToDeleteAd: "اشتہار حذف کرنے میں ناکام رہا۔ براہر کوشش کریں۔"
  },
  french: {
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
    adDeletedSuccessfully: "Annonce supprimée avec succès!",
    failedToDeleteAd: "Échec de la suppression de l'annonce. Veuillez réessayer."
  }
};

const MyAds = () => {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { userProfile, setUserProfile } = useUserProfile();
  const navigate = useNavigate();
  
  const t = translations[language];
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

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/mockvehicle.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `https://api.emov.com.pk/image/${imagePath}`;
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return numPrice.toLocaleString('en-PK');
  };

  const fetchMyAds = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.ads.getMyAds(page, pagination.perPage);

      if (response && response.data) {
        setAds(response.data);
        setPagination(response.pagination || {
          total: response.data.length,
          page,
          perPage: pagination.perPage,
          totalPages: Math.ceil(response.data.length / pagination.perPage)
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
      await apiService.ads.delete(deleteModal.ad.AdID);
      setDeleteModal({ isOpen: false, ad: null });
      await fetchMyAds(1);
      toast.success(t.adDeletedSuccessfully);
    } catch (error) {
      console.error('Failed to delete ad:', error);
      toast.error(t.failedToDeleteAd);
      setDeleteModal({ isOpen: false, ad: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, ad: null });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMyAds(newPage);
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-secondary">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-emov-purple"></div>
          <FaCar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emov-purple" />
        </div>
        <p className="mt-8 text-xl font-semibold text-text-primary">{t.loadingAds}</p>
        <p className="mt-2 text-text-secondary">This won't take long</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-medium text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchMyAds()}
            className="px-6 py-3 bg-emov-purple text-white rounded-xl hover:bg-emov-purple-dark transition-colors font-medium"
          >
            {t.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">

       {/* Header Section */}
        <div className="relative">
          <Header 
            userProfile={userProfile} 
            handleLogout={handleLogout} 
            onSearch={false} 
          />
        </div>
      

      <div className="relative">
        <Navbar
          isDark={theme === 'dark'}
          toggleTheme={toggleTheme}
          userProfile={userProfile}
          handleLogout={handleLogout}
        />
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t.myAds}</h1>
        <p className="mt-2 text-text-secondary">{t.manageAds}</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {ads.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            </div>
            <h3 className="text-2xl font-semibold text-text-primary mb-3">{t.noAdsYet}</h3>
            <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
              {t.startSelling}
            </p>
            <button
              onClick={() => navigate('/my-ads')}
              className="px-8 py-4 bg-emov-purple text-white text-lg font-medium rounded-xl hover:bg-emov-purple-dark transition-colors shadow-md"
            >
              {t.createFirstAd}
            </button>
          </div>
        ) : (
          <>
            {/* Create New Ad Button - shown when user has ads */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => navigate('/my-ads')}
                className="px-6 py-3 bg-emov-purple text-white font-medium rounded-xl hover:bg-emov-purple-dark transition-colors shadow-md flex items-center gap-2"
              >
                <FaCar className="w-5 h-5" />
                {t.createNewAd}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {ads.map((ad) => (
                <div
                  key={ad.AdID}
                  onClick={() => handleAdClick(ad)}
                  className="bg-bg-secondary rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-border-primary group"
                >
                  {/* Image Container */}
                  <div className="relative h-56 bg-gray-50 overflow-hidden">
                    <img
                      src={getImageUrl(ad.Images?.[0])}
                      alt={ad.VehicleName || `${ad.BrandName} ${ad.ModelName}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Exact original emovcheck.png badge */}
                    <img
                      src="/emovcheck.png"
                      alt="Emov Check"
                      className="absolute top-3 right-3 w-12 h-12 object-contain"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-text-primary line-clamp-1 mb-3">
                      {ad.VehicleName || `${ad.BrandName || ''} ${ad.ModelName || ''}`.trim()}
                    </h3>

                    <p className="text-2xl font-bold text-emov-purple mb-5">
                      PKR {formatPrice(ad.VehiclePrice)}
                    </p>

                    {/* Details */}
                    <div className="space-y-3 text-text-secondary">
                      <div className="flex items-center gap-3">
                        <FaCalendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">{ad.RegistrationYear} • {ad.Transmission}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm truncate">{ad.LocationName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMoneyBillWave className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">{ad.VehicleMileage?.toLocaleString()} km</span>
                      </div>
                    </div>

                    {/* Delete Action */}
                    <div className="mt-6 pt-5 border-t border-border-primary/50">
                      <button
                        onClick={(e) => handleDelete(e, ad)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm"
                      >
                        <FaTrash className="w-4 h-4" />
                        Delete Ad
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 pb-20 sm:pb-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-5 py-3 rounded-xl border border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Previous
                </button>

                <span className="text-text-secondary font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-5 py-3 rounded-xl border border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 transition-opacity duration-300">
          <div className="bg-bg-secondary rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ease-out scale-100 opacity-100 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-bold text-text-primary mb-4">{t.confirmDeletion}</h3>
            <p className="text-text-secondary mb-6 leading-relaxed">
              {t.deleteAdMessage}
            </p>
            {deleteModal.ad && (
              <p className="text-lg font-semibold text-text-primary mb-8">
                {deleteModal.ad.BrandName} {deleteModal.ad.ModelName} ({deleteModal.ad.RegistrationYear})
              </p>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-6 py-3 rounded-xl border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors font-medium"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                {t.deleteAd}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav activePage="myads" />
    </div>
  );
};

export default MyAds;