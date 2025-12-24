import { useState, useEffect } from 'react';
import apiService from '../services/Api';

// Image URL processing function (same as in Navbar)
const getImageUrl = (imagePath, isAvatar = false) => {
  if (!imagePath) {
    return isAvatar ? '/default-avatar.png' : null;
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle avatar images (like profile photos)
  if (isAvatar) {
    const avatarUrl = `https://api.emov.com.pk/image/${imagePath}`;
    return avatarUrl;
  }
  
  // For regular images, use the standard format
  const imageUrl = `https://api.emov.com.pk/image/${imagePath}`;
  return imageUrl;
};

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState(() => {
    // Initialize with data from localStorage if available
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const profile = JSON.parse(userData);
        
        // Handle profile picture URL construction
        if (profile.picture) {
          // If picture is already a full URL, use it as-is
          if (!profile.picture.startsWith('http')) {
            profile.picture = `https://api.emov.com.pk/image/${profile.picture.replace(/^\/+/, '')}`;
          }
        } else if (profile.imageUrl) {
          // Fallback to imageUrl if picture doesn't exist
          if (!profile.imageUrl.startsWith('http')) {
            profile.imageUrl = `https://api.emov.com.pk/image/${profile.imageUrl.replace(/^\/+/, '')}`;
          }
          profile.picture = profile.imageUrl;
        } else if (profile.profileImage) {
          // Handle profileImage field
          if (!profile.profileImage.startsWith('http')) {
            profile.profileImage = `https://api.emov.com.pk/image/${profile.profileImage.replace(/^\/+/, '')}`;
          }
          profile.picture = profile.profileImage;
        }
        
        return profile;
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
    return null;
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // First try to get user from localStorage for immediate display
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          
          // Format user data consistently
          const userProfileData = {
            id: user.id || user.userId,
            name: user.name || user.username || 'User',
            email: user.email || '',
            picture: user.picture || user.imageUrl || user.profileImage || null,
            username: user.username || user.name || 'User'
          };
          
          // Construct full URL for picture if needed
          if (userProfileData.picture && !userProfileData.picture.startsWith('http')) {
            userProfileData.picture = getImageUrl(userProfileData.picture, true);
          }
          
          setUserProfile(userProfileData);
          return;
        }

        // If no localStorage data, fetch from API
        const response = await apiService.user.getProfile();
        if (response.status === 200) {
          const userData = response.data.data || response.data;
          
          // Format API response consistently
          const formattedUser = {
            id: userData.id || userData.userId,
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.picture || userData.imageUrl || userData.profileImage || null,
            username: userData.username || userData.name || 'User'
          };
          
          // Construct full URL for picture if needed
          if (formattedUser.picture && !formattedUser.picture.startsWith('http')) {
            formattedUser.picture = getImageUrl(formattedUser.picture, true);
          }
          
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(formattedUser));
          setUserProfile(formattedUser);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUserProfile(JSON.parse(savedUser));
        } else {
          setUserProfile(null);
        }
      }
    };

    fetchUserProfile();

    // Listen for storage events (from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        const userData = e.newValue;
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            
            // Handle profile picture URL construction
            if (parsedUserData.picture) {
              if (!parsedUserData.picture.startsWith('http')) {
                parsedUserData.picture = `https://api.emov.com.pk/image/${parsedUserData.picture.replace(/^\/+/, '')}`;
              }
            } else if (parsedUserData.imageUrl) {
              if (!parsedUserData.imageUrl.startsWith('http')) {
                parsedUserData.imageUrl = `https://api.emov.com.pk/image/${parsedUserData.imageUrl.replace(/^\/+/, '')}`;
              }
              parsedUserData.picture = parsedUserData.imageUrl;
            } else if (parsedUserData.UserProfile) {
              if (!parsedUserData.UserProfile.startsWith('http')) {
                parsedUserData.UserProfile = `https://api.emov.com.pk/image/${parsedUserData.UserProfile.replace(/^\/+/, '')}`;
              }
              parsedUserData.picture = parsedUserData.UserProfile;
            }
            
            setUserProfile(parsedUserData);
          } catch (error) {
            console.error('Error parsing updated user data:', error);
          }
        } else {
          setUserProfile(null);
        }
      }
    };

    // Listen for custom profile update events
    const handleProfileUpdate = (e) => {
      const updatedUser = e.detail;
      if (updatedUser) {
        setUserProfile(updatedUser);
      }
    };

    // Also check for direct localStorage updates (same tab)
    const checkLocalStorage = () => {
      try {
        const userData = localStorage.getItem('user');
        const currentProfile = JSON.stringify(userProfile);
        if (userData !== currentProfile) {
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            
            // Handle profile picture URL construction
            if (parsedUserData.picture) {
              if (!parsedUserData.picture.startsWith('http')) {
                parsedUserData.picture = `https://api.emov.com.pk/image/${parsedUserData.picture.replace(/^\/+/, '')}`;
              }
            } else if (parsedUserData.imageUrl) {
              if (!parsedUserData.imageUrl.startsWith('http')) {
                parsedUserData.imageUrl = `https://api.emov.com.pk/image/${parsedUserData.imageUrl.replace(/^\/+/, '')}`;
              }
              parsedUserData.picture = parsedUserData.imageUrl;
            } else if (parsedUserData.UserProfile) {
              if (!parsedUserData.UserProfile.startsWith('http')) {
                parsedUserData.UserProfile = `https://api.emov.com.pk/image/${parsedUserData.UserProfile.replace(/^\/+/, '')}`;
              }
              parsedUserData.picture = parsedUserData.UserProfile;
            }
            
            setUserProfile(parsedUserData);
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    // Set up periodic check for same-tab updates
    const intervalId = setInterval(checkLocalStorage, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      clearInterval(intervalId);
    };
  }, []);

  return { userProfile, setUserProfile };
};
