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
  );
}
