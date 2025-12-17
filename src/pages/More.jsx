import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCog, FaSignOutAlt, FaArrowLeft, FaSun, FaMoon, FaGlobe } from 'react-icons/fa';
import { useTheme } from '../hooks/useTheme';
import MobileBottomNav from '../components/Layout/MobileBottomNav';

function More({ handleLogout }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Language state
  const [language, setLanguage] = React.useState(() => {
    try {
      const savedLanguage = localStorage.getItem('language');
      return savedLanguage || 'english';
    } catch {
      return 'english';
    }
  });
  
  // Modal state
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);
  
  // Language change handler
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setShowLanguageModal(false);
    // You can add additional logic here for language switching
    // For example, updating a global language context or reloading the page
  };
  
  // Get user profile from localStorage
  const [userProfile, setUserProfile] = React.useState(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const profile = JSON.parse(userData);
        
        // Use the same logic as Profile.jsx for image handling
        const displayUser = {
          name: profile.name || profile.fullName || profile.username || 'User',
          email: profile.email || profile.Email || '',
          gender: profile.gender || profile.Gender || '',
          mobileNo: profile.mobileNo || profile.phone || profile.Phone || '',
          secondaryMobileNo: profile.secondaryMobileNo || profile.secondaryPhone || '',
          dateOfBirth: profile.dateOfBirth || profile.dob || profile.DateOfBirth || '',
          picture: profile.picture || profile.imageUrl || profile.UserProfile || profile.avatar || '',
        };
        
        // Apply the same image URL logic as Profile.jsx
        const getAvatarSrc = () => {
          const src = displayUser.picture;
          if (!src) return '';
          if (src.startsWith('http')) return src;
          return `https://api.emov.com.pk/image/${src.replace(/^\/+/, '')}`;
        };
        
        if (displayUser.picture) {
          profile.picture = getAvatarSrc();
        }
        
        return profile;
      }
    } catch (e) {
      console.error('Error initializing user profile:', e);
    }
    return null;
  });

  // Helper function to get first letter of username for profile picture
  const getUserInitial = (username) => {
    if (!username || typeof username !== 'string') return 'U';
    return username.trim().charAt(0).toUpperCase();
  };

  // Custom sign out handler
  const handleSignOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-text-primary">More</h1>
          </div>
        </div>
      </div>

      {/* User Information Section */}
      {userProfile && (
        <div className="bg-bg-secondary border-b border-border-primary">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center text-xl font-medium rounded-full ${
                userProfile?.picture ? 'overflow-hidden' : 'bg-[var(--emov-purple)] text-white border-0'
              }`}>
                {userProfile?.picture ? (
                  <>
                    <img 
                      src={userProfile.picture} 
                      alt={userProfile?.username || 'User'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to avatar if image fails to load
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-[var(--emov-purple)] text-white">
                      {getUserInitial(userProfile?.name || userProfile?.username || 'U')}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full items-center justify-center bg-[var(--emov-purple)] text-white flex">
                    {getUserInitial(userProfile?.name || userProfile?.username || 'U')}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {userProfile?.name || 'User'}
                </h2>
                <p className="text-sm text-text-tertiary truncate">
                  {userProfile?.email || 'No email'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Options Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden">
          {/* My Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-4 text-left transition-colors text-text-primary hover:bg-bg-tertiary border-b border-border-primary"
          >
            <FaUser className="w-5 h-5 flex-shrink-0 text-text-secondary" />
            <span className="text-base font-medium">My Profile</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center space-x-3 px-4 py-4 text-left transition-colors text-text-primary hover:bg-bg-tertiary border-b border-border-primary"
          >
            <FaCog className="w-5 h-5 flex-shrink-0 text-text-secondary" />
            <span className="text-base font-medium">Settings</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-4 text-left transition-colors text-text-primary hover:bg-bg-tertiary border-b border-border-primary"
          >
            <div className="flex items-center space-x-3">
              {isDark ? <FaSun className="w-5 h-5 flex-shrink-0 text-text-secondary" /> : <FaMoon className="w-5 h-5 flex-shrink-0 text-text-secondary" />}
              <span className="text-base font-medium">Theme</span>
            </div>
            <span className="text-sm text-text-tertiary">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full flex items-center justify-between px-4 py-4 text-left transition-colors text-text-primary hover:bg-bg-tertiary border-b border-border-primary"
          >
            <div className="flex items-center space-x-3">
              <FaGlobe className="w-5 h-5 flex-shrink-0 text-text-secondary" />
              <span className="text-base font-medium">Language</span>
            </div>
            <span className="text-sm text-text-tertiary capitalize">
              {language}
            </span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-4 text-left transition-colors text-text-primary hover:bg-bg-tertiary"
          >
            <FaSignOutAlt className="w-5 h-5 flex-shrink-0 text-text-secondary" />
            <span className="text-base font-medium">Sign out</span>
          </button>
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:hidden"></div>
      
      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out"
            style={{
              animation: 'fadeIn 0.3s ease-in-out'
            }}
            onClick={() => setShowLanguageModal(false)}
          />
          <div 
            className="relative bg-bg-primary rounded-2xl border border-border-primary shadow-xl max-w-sm w-full p-6 transition-all duration-300 ease-in-out"
            style={{
              animation: 'slideUp 0.3s ease-in-out'
            }}
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">Select Language</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer transition-colors duration-200 hover:bg-bg-tertiary p-2 rounded-lg">
                <input
                  type="radio"
                  name="language"
                  value="english"
                  checked={language === 'english'}
                  onChange={() => handleLanguageChange('english')}
                  className="w-4 h-4 text-emov-green focus:ring-emov-green transition-colors duration-200"
                />
                <span className="text-text-primary transition-colors duration-200">English</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer transition-colors duration-200 hover:bg-bg-tertiary p-2 rounded-lg">
                <input
                  type="radio"
                  name="language"
                  value="urdu"
                  checked={language === 'urdu'}
                  onChange={() => handleLanguageChange('urdu')}
                  className="w-4 h-4 text-emov-green focus:ring-emov-green transition-colors duration-200"
                />
                <span className="text-text-primary transition-colors duration-200">Urdu</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer transition-colors duration-200 hover:bg-bg-tertiary p-2 rounded-lg">
                <input
                  type="radio"
                  name="language"
                  value="french"
                  checked={language === 'french'}
                  onChange={() => handleLanguageChange('french')}
                  className="w-4 h-4 text-emov-green focus:ring-emov-green transition-colors duration-200"
                />
                <span className="text-text-primary transition-colors duration-200">French</span>
              </label>
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="mt-6 w-full bg-emov-green text-white py-2 rounded-lg hover:bg-emov-green/90 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      
      <MobileBottomNav activePage="more" />
    </div>
  );
}

export default More;
