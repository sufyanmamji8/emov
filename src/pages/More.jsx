import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCog, FaSignOutAlt, FaArrowLeft, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../hooks/useTheme';

function More({ handleLogout }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Get user profile from localStorage
  const [userProfile, setUserProfile] = React.useState(() => {
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
                  <img 
                    src={userProfile.picture} 
                    alt={userProfile?.username || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${userProfile?.picture ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                  {getUserInitial(userProfile?.name || userProfile?.username || 'U')}
                </div>
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
    </div>
  );
}

export default More;
