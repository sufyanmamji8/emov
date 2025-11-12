import React, { useState, useEffect } from 'react';
import { FaCaretDown, FaSun, FaMoon } from 'react-icons/fa';
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
          <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-12 sm:h-16 py-6 border-b border-border-primary">
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
                   <button className="flex items-center space-x-1 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors border-none">
                     <span>Sign In</span>
                   </button>
                   <button className="flex items-center space-x-1 text-text-primary px-4 py-1 rounded-full text-sm font-medium transition-colors"
                     style={{
                       backgroundColor: 'var(--emov-green, #27c583ff)',
                     }}
                     onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                     onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                   >
                     <span>Sign Up</span>
                   </button>
                   
                 </div>
               </div>
          </div>
               
      <Navbar 
        isDark={theme === 'dark'}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        userProfile={userProfile}
        handleLogout={handleLogout}
      />
      <div className="pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-6">My Chats</h1>
          <div className="p-6 rounded-lg bg-bg-secondary shadow">
            <p className="text-center text-text-tertiary">Your chat messages will appear here</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
