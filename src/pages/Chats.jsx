import React, { useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

export default function Chats() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('english');
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // First try to get from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Format the user data to match Navbar's expectations
          const formattedUser = {
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.imageUrl ? `https://api.emov.com.pk/${userData.imageUrl.replace(/^\//, '')}` : null,
            username: userData.username
          };
          setUserProfile(formattedUser);
          return;
        }

        // If not in localStorage, fetch from API
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('https://api.emov.com.pk/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Format the response data to match Navbar's expectations
          const userData = response.data.data || response.data;
          const formattedUser = {
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.imageUrl ? `https://api.emov.com.pk/${userData.imageUrl.replace(/^\//, '')}` : null,
            username: userData.username
          };
          
          // Save to localStorage for future use
          localStorage.setItem('user', JSON.stringify(formattedUser));
          setUserProfile(formattedUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If there's an error, try to use any existing user data from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUserProfile(JSON.parse(savedUser));
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <React.Fragment>
      {/* Top Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center h-8 sm:h-10">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--emov-green, #00FFA9)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Download App</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-sm font-medium text-gray-700">
                Sign In
              </button>
              <button className="text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--emov-green, #0DFF9A)',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-bg-primary text-text-primary">
      <Navbar 
        isDark={theme === 'dark'}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        userProfile={userProfile}
        handleLogout={handleLogout}
      />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-6">My Chats</h1>
          <div className="p-6 rounded-lg bg-bg-secondary shadow">
            <p className="text-center text-text-tertiary">Your chat messages will appear here</p>
          </div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
}
