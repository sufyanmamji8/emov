import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaGlobe, FaCaretDown, FaSignOutAlt } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';
import axios from 'axios';

function Navbar({ isDark, toggleTheme, language, setLanguage, userProfile, handleLogout }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Helper function to get first letter of username for profile picture
  const getUserInitial = (username) => {
    if (!username || typeof username !== 'string') return 'U';
    return username.trim().charAt(0).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  return (
    <nav className="w-full py-6 px-6 sm:px-8 shadow-md" style={{
      background: 'var(--emov-gradient)'
    }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="/loginemov.png" 
              alt="Emov Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="h-8">
            <img 
              src="/emovfont.png" 
              alt="Emov" 
              className="h-full w-auto"
            />
          </div>
        </div>

        {/* Navigation Links with increased spacing */}
        <div className="hidden md:flex items-center space-x-8 lg:space-x-12 mx-8">
          <a 
            href="/dashboard" 
            className="relative text-base font-medium text-white hover:text-gray-100 group transition-colors duration-300"
          >
            Home
            <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/dashboard' ? 'w-full' : ''}`}></span>
          </a>
          <a 
            href="/chats" 
            className="relative text-base font-medium text-white hover:text-gray-100 group transition-colors duration-300"
          >
            Chats
            <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/chats' ? 'w-full' : ''}`}></span>
          </a>
          <a 
            href="/my-ads" 
            className="relative text-base font-medium text-white hover:text-gray-100 group transition-colors duration-300"
          >
            My Ads
            <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/my-ads' ? 'w-full' : ''}`}></span>
          </a>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 border rounded-md ${isDark ? 'border-gray-600 focus:ring-white' : 'border-gray-300 focus:ring-gray-500'}`}
            >
              <option value="english">EN</option>
              <option value="urdu">UR</option>
              <option value="french">FR</option>
            </select>
            <FaGlobe className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none w-3 h-3 sm:w-4 sm:h-4 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
          </div>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className={`focus:outline-none p-2 sm:p-2.5 transition-all duration-200 hover:scale-105 rounded-xl ${isDark ? 'text-yellow-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            style={{ borderRadius: '12px' }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FaSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 text-primary focus:outline-none transition-colors group"
              aria-expanded={showProfileDropdown}
              aria-haspopup="true"
            >
              <div 
                className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-base font-medium overflow-hidden ${
                  isDark ? 'bg-[var(--emov-purple)] text-white' : 'bg-white text-[var(--emov-purple)]'
                }`}
              >
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
              <span className="hidden sm:block text-sm font-medium text-white">
                {userProfile?.name || 'User'}
              </span>
              <FaCaretDown className={`w-3 h-3 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            <div 
              className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50 transition-all duration-200 ease-out transform origin-top-right bg-bg-secondary border border-border-primary ${
                showProfileDropdown 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
              style={{
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color)'
              }}
            >
              <div className="p-4 border-b border-border-primary">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-lg font-medium rounded-full ${
                    userProfile?.picture ? 'overflow-hidden' : 'bg-emov-purple text-white border-0'
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
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-text-primary">
                      {userProfile?.name || 'User'}
                    </p>
                    <p className="text-xs truncate text-text-tertiary">
                      {userProfile?.email || 'No email'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-bg-tertiary rounded-md"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;