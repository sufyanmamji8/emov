import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaGlobe, FaCaretDown, FaSignOutAlt, FaBars, FaTimes, FaCog, FaUser } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';
import axios from 'axios';

function Navbar({ isDark, toggleTheme, language, setLanguage, userProfile, handleLogout }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.hamburger-menu')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown, isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Helper function to get first letter of username for profile picture
  const getUserInitial = (username) => {
    if (!username || typeof username !== 'string') return 'U';
    return username.trim().charAt(0).toUpperCase();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Custom sign out handler that prevents default navigation
  const handleSignOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
    setShowProfileDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const handleNavLinkClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="w-full py-0 sm:py-0 pl-0 sm:pl-2 lg:pl-0 pr-0 sm:pr-6 lg:pr-0 relative z-50 bg-transparent">
      
      <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo and Navigation Links */}
        <div className="flex items-center space-x-8 lg:space-x-12">
          {/* Logo and Hamburger Menu */}
          <div className="flex items-center space-x-2">
            {/* Hamburger Menu Button - Visible only on mobile */}
            <button
              className="hamburger-menu md:hidden p-1 focus:outline-none"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              style={{ color: 'var(--emov-green)' }}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-4 h-4" />
              ) : (
                <FaBars className="w-4 h-4" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center justify-center h-16 sm:h-20">
              <div className="w-auto h-3/4 flex items-center px-2">
                <img 
                  src="/loginemovv.png" 
                  alt="Emov Logo" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links - Now positioned right after logo */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
            <a 
              href="/dashboard" 
              className="relative text-base font-medium text-text-primary hover:text-text-secondary group transition-colors duration-300"
            >
              Home
              <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/dashboard' ? 'w-full' : ''}`}></span>
            </a>
            <a 
              href="/chats" 
              className="relative text-base font-medium text-text-primary hover:text-text-secondary group transition-colors duration-300"
            >
              Chats
              <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/chats' ? 'w-full' : ''}`}></span>
            </a>
            <a 
              href="/my-ads" 
              className="relative text-base font-medium text-text-primary hover:text-text-secondary group transition-colors duration-300"
            >
              My Ads
              <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/my-ads' ? 'w-full' : ''}`}></span>
            </a>
            <a 
              href="/" 
              className="relative text-base font-medium text-text-primary hover:text-text-secondary group transition-colors duration-300"
            >
              More
              <span className={`absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--emov-purple)] transition-all duration-300 group-hover:w-full ${window.location.pathname === '/' ? 'w-full' : ''}`}></span>
            </a>
          </div>
        </div>

        {/* Right side - Theme Toggle, Language Selector, and Profile */}
        {userProfile && (
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* User Profile Dropdown */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 text-primary focus:outline-none transition-colors group"
              aria-expanded={showProfileDropdown}
              aria-haspopup="true"
            >
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full flex items-center justify-center text-base font-medium overflow-hidden border-2 border-border-primary bg-bg-card text-text-primary"
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
              <span className="hidden sm:block text-sm font-medium text-black">
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
              <div className="p-1 space-y-1">
                <a
                  href="/profile"
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-bg-tertiary rounded-md"
                >
                  <FaUser className="w-4 h-4 flex-shrink-0" />
                  <span>My Profile</span>
                </a>
                <a
                  href="/settings"
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-bg-tertiary rounded-md"
                >
                  <FaCog className="w-4 h-4 flex-shrink-0" />
                  <span>Settings</span>
                </a>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-bg-tertiary rounded-md text-left"
                >
                  <FaSignOutAlt className="w-4 h-4 flex-shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Mobile Menu Sidebar */}
        <div 
          className="absolute top-0 left-0 h-full w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-primary">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="/loginemov.png" 
                    alt="Emov Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="h-6">
                  <img 
                    src="/emovfont.png" 
                    alt="Emov" 
                    className="h-full w-auto"
                  />
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Navigation Links */}
              <div className="space-y-2 mb-8">
                <a 
                  href="/dashboard" 
                  className="block py-3 px-4 text-lg font-medium text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  onClick={handleNavLinkClick}
                >
                  Home
                </a>
                <a 
                  href="/chats" 
                  className="block py-3 px-4 text-lg font-medium text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  onClick={handleNavLinkClick}
                >
                  Chats
                </a>
                <a 
                  href="/my-ads" 
                  className="block py-3 px-4 text-lg font-medium text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  onClick={handleNavLinkClick}
                >
                  My Ads
                </a>
                 <a 
                  href="/" 
                  className="block py-3 px-4 text-lg font-medium text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  onClick={handleNavLinkClick}
                >
                  More
                </a>
              </div>

              {/* Mobile Controls */}
              <div className="space-y-4 border-t border-border-primary pt-6">
                {/* Language Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-text-primary font-medium">Language</span>
                  <div className="relative w-32">
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 border rounded-md bg-bg-secondary text-text-primary border-border-primary focus:ring-[var(--emov-purple)] appearance-none"
                    >
                      <option value="english">English</option>
                      <option value="urdu">Urdu</option>
                      <option value="french">French</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <FaGlobe className="text-text-tertiary w-4 h-4" />
                      <FaCaretDown className="ml-1 text-text-tertiary w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-text-primary font-medium">Theme</span>
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors bg-bg-tertiary text-text-primary"
                  >
                    {isDark ? (
                      <>
                        <FaSun className="w-5 h-5" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <FaMoon className="w-5 h-5" />
                        <span>Dark</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Footer - Only Sign Out Button */}
            <div className="p-4 border-t border-border-primary">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors border border-border-primary"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;