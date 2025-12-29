// src/components/Layout/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FaSun, FaMoon, FaBell, FaUser, FaSearch, FaFilter, FaCaretDown, FaCheck } from 'react-icons/fa';
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

// Language translations for Header
const translations = {
  english: {
    downloadApp: "Download App",
    signIn: "Sign In",
    signUp: "Sign Up",
    switchToLightMode: "Switch to light mode",
    switchToDarkMode: "Switch to dark mode"
  },
  urdu: {
    downloadApp: "ایپ ڈاؤن لوڈ کریں",
    signIn: "سائن ان کریں",
    signUp: "سائن اپ کریں",
    switchToLightMode: "لائٹ موڈ میں سوئچ کریں",
    switchToDarkMode: "ڈارک موڈ میں سوئچ کریں"
  },
  french: {
    downloadApp: "Télécharger l'App",
    signIn: "Se Connecter",
    signUp: "S'inscrire",
    switchToLightMode: "Basculer en mode clair",
    switchToDarkMode: "Basculer en mode sombre"
  }
};

const Header = ({ userProfile, handleLogout, onSearch, searchQuery, setSearchQuery }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, languages, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = translations[language] || translations.english;
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Update dropdown position when shown
  useEffect(() => {
    if (showLanguageDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        right: window.innerWidth - rect.right
      });
    }
  }, [showLanguageDropdown]);

  // Close dropdown when clicking outside - FIXED VERSION
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the button and dropdown
      if (
        showLanguageDropdown && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    // Use 'click' instead of 'mousedown' to allow onClick to fire first
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };


  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-8 sm:h-10 py-6 border-b border-border-primary backdrop-blur-sm bg-bg-primary/80">
      {/* Left side - Download App */}
      <div className="flex items-center space-x-2 group cursor-pointer">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400/10 to-green-500/10 group-hover:from-emerald-400/20 group-hover:to-green-500/20 transition-all duration-300">
          <svg 
            className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            style={{color: 'var(--emov-green, #00FFA9)'}}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-text-primary group-hover:text-text-secondary transition-colors duration-300">
          {t.downloadApp}
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Desktop Language Selector and Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Enhanced Language Selector */}
          <div className="relative language-dropdown">
            <button
              ref={buttonRef}
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center space-x-2 bg-bg-secondary/50 hover:bg-bg-secondary text-text-primary px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 border border-border-primary/50 hover:border-emerald-500/30 group"
            >
              <span className="text-lg">{currentLanguage?.flag}</span>
              <span className="font-medium">{currentLanguage?.label}</span>
              <FaCaretDown 
                className={`text-text-secondary w-3 h-3 transition-all duration-300 ease-out group-hover:text-emerald-500 ${
                  showLanguageDropdown ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </button>
          </div>
          
          {/* Enhanced Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="relative focus:outline-none p-2.5 transition-all duration-300 hover:scale-110 rounded-xl text-text-primary hover:bg-bg-secondary border border-border-primary/50 hover:border-emerald-500/30 group overflow-hidden"
            aria-label={theme === 'dark' ? t.switchToLightMode : t.switchToDarkMode}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-green-500/0 group-hover:from-emerald-400/10 group-hover:to-green-500/10 transition-all duration-300 rounded-xl"></div>
            
            <div className="relative">
              {theme === 'dark' ? (
                <FaSun className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
              ) : (
                <FaMoon className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
              )}
            </div>
          </button>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          {!userProfile && (
            <div className="flex items-center space-x-3">
              {/* Sign In Button */}
              <button
                className="flex items-center space-x-1 text-sm font-medium text-text-primary hover:text-text-secondary transition-all duration-300 px-4 py-2 rounded-lg hover:bg-bg-secondary"
                onClick={() => navigate('/login')}
              >
                <span>{t.signIn}</span>
              </button>
              
              {/* Sign Up Button */}
              <button
                className="relative flex items-center space-x-1 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group"
                style={{
                  backgroundColor: 'var(--emov-green, #27c583ff)',
                }}
                onClick={() => navigate('/signup')}
              >
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative z-10">{t.signUp}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Keyframes for dropdown animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Portal-rendered dropdown */}
      {showLanguageDropdown && createPortal(
        <div 
          ref={dropdownRef}
          className="bg-bg-primary border border-border-primary rounded-xl shadow-2xl overflow-hidden min-w-[160px] transition-all duration-300 ease-out transform-gpu"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            zIndex: 9999999,
            position: 'fixed',
            top: dropdownPosition.top,
            right: dropdownPosition.right
          }}
        >
          <div className="py-2">
            {languages.map((lang, index) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between group/item ${
                  language === lang.value 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-text-primary font-medium' 
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {language === lang.value && (
                  <FaCheck className="w-3 h-3 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Header;