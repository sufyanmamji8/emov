import React, { useState, useEffect, useRef } from 'react';
import { FaCaretDown, FaSun, FaMoon, FaPaperPlane, FaImage, FaTimes, FaSearch, FaMicrophone } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import chatService from '../services/chatService'; 
import { FaTrash, FaUserSlash } from 'react-icons/fa';
import axios from 'axios';




// Convert date to Pakistan time (UTC+5)
const toPakistanTime = (dateString) => {
  if (!dateString) return new Date();
  
  const date = new Date(dateString);
  // Convert to Pakistan time (UTC+5)
  const offset = date.getTimezoneOffset() + 300; // 300 minutes = 5 hours
  return new Date(date.getTime() + offset * 60 * 1000);
};


// Format time for message timestamps (e.g., '2:30 PM')
const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  
  const date = toPakistanTime(dateString);
  return date.toLocaleTimeString('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Utility function for time formatting
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  
  const date = toPakistanTime(dateString);
  const now = toPakistanTime();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  }
  
  // For older dates, return a formatted date in Pakistan time
  return date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Fixed: Avatar component with proper centering
const Avatar = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const [imageError, setImageError] = useState(false);
  
  // Check if we should show image or fallback
  const showImage = user.avatar && user.avatar !== '/default-avatar.png' && !imageError;

  return (
    <div className="relative flex-shrink-0">
      {showImage ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-emerald-200`}
          onError={() => {
            console.log('❌ Avatar image failed to load:', user.avatar);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('✅ Avatar image loaded successfully:', user.avatar);
            setImageError(false);
          }}
        />
      ) : (
        <div 
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-200 font-bold text-emerald-600`}
        >
          {user.firstLetter}
        </div>
      )}
    </div>
  );
};

export default function Chats() {
  const { theme, toggleTheme } = useTheme();
  const { 
    chats, 
    currentChat, 
    messages, 
    sendMessage, 
    setActiveChat, 
    loadChats,
    unreadCount,
    markMessagesAsRead,
     deleteMessage,
    loading,
    currentUserId,
    error
  } = useChat();
  
  // Get current user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = {
    id: user.id || user.userId || currentUserId,
    name: user.name || 'You',
    avatar: user.profileImage || '/default-avatar.png',
    firstLetter: (user.name || 'Y').charAt(0).toUpperCase()
  };
  const [language, setLanguage] = useState('english');
  const [userProfile, setUserProfile] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messageLoading, setMessageLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [isDeleteConversationModalOpen, setIsDeleteConversationModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState(null);

  // Handle deleting a conversation
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      setIsDeletingConversation(true);
      await chatService.deleteConversation(conversationToDelete.conversation_id || conversationToDelete.id);
      
      // Remove the conversation from the list
      setChats(prevChats => prevChats.filter(chat => chat.conversation_id !== conversationToDelete.conversation_id && chat.id !== conversationToDelete.id));
      
      // If the deleted conversation is the current chat, clear it
      if (currentChat && (currentChat.conversation_id === conversationToDelete.conversation_id || currentChat.id === conversationToDelete.id)) {
        setCurrentChat(null);
        setMessages([]);
      }
      
      // Close the modal and reset state
      setIsDeleteConversationModalOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  // Add these upload functions
  // Update handleSendImage to convert the URL
  const handleSendImage = async () => {
    if (!selectedImageFile) {
      throw new Error('No image file selected');
    }

    try {
      console.log('📤 Uploading image file...');
      const response = await chatService.uploadImage(selectedImageFile);
      console.log('✅ Image upload response:', response);
      
      // Extract the image URL from the response
      let imageUrl = '';
      
      // Handle different response formats
      if (response.url) {
        // If the response has a direct URL
        imageUrl = response.url;
      } else if (response.original) {
        // If the response has an original field
        imageUrl = response.original;
      } else if (response.data?.url) {
        // If the response is nested in a data object
        imageUrl = response.data.url;
      } else if (response) {
        // If the response is the URL directly
        imageUrl = response;
      }
      
      // Remove any '/uploads/' segment from the URL if present
      if (imageUrl) {
        imageUrl = imageUrl.replace('/uploads/', '/');
        
        // If it's not a full URL, prepend the base URL
        if (!imageUrl.startsWith('http')) {
          imageUrl = `https://api.emov.com.pk/image/${imageUrl}`;
        }
        
        console.log('✅ Image URL after formatting:', imageUrl);
        return imageUrl;
      }
      
      throw new Error('Could not determine image URL from server response');
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  };

  const handleSendAudio = async () => {
    if (!selectedAudioFile) {
      throw new Error('No audio file selected');
    }

    try {
      console.log('📤 Uploading audio file...');
      const audioUrl = await chatService.uploadAudio(selectedAudioFile);
      console.log('✅ Audio uploaded, URL:', audioUrl);
      return audioUrl;
    } catch (error) {
      console.error('❌ Audio upload failed:', error);
      throw error;
    }
  };

  // Fixed: Proper image URL handling for upload API responses
 // Fixed: Better image URL handling that preserves full URLs from API
// Fixed: Correct image URL handling
// Fixed: Use correct image URL path
const getImageUrl = (imagePath, isAvatar = false) => {
  console.log('🖼️ Processing image URL:', imagePath, 'isAvatar:', isAvatar);
  
  // Handle null/undefined/empty cases
  if (!imagePath || ['N/A', 'null', 'undefined', ''].includes(String(imagePath))) {
    console.log('⚠️ No valid image path provided, using default avatar');
    return isAvatar ? '/default-avatar.png' : null;
  }

  // Convert to string and trim
  let url = String(imagePath).trim();
  
  // Check if it's already a full URL
  if (url.startsWith('http')) {
    // Convert /writable/uploads/ to /image/ for consistency
    if (url.includes('/writable/uploads/')) {
      const convertedUrl = url.replace('/writable/uploads/', '/image/');
      console.log('🔄 Converted URL:', convertedUrl);
      return convertedUrl;
    }
    return url;
  }
  
  // Handle avatar images (like profile photos)
  if (isAvatar) {
    // For avatars, we use the direct path without /uploads/
    const avatarUrl = `https://api.emov.com.pk/image/${url}`;
    console.log('👤 Avatar URL:', avatarUrl);
    return avatarUrl;
  }
  
  // For regular images, use the standard format
  const imageUrl = `https://api.emov.com.pk/image/${url}`;
  console.log('🌅 Regular image URL:', imageUrl);
  return imageUrl;
};

  // Add this function for audio URLs
  const getAudioUrl = (audioPath) => {
    if (!audioPath || audioPath === 'N/A' || audioPath === 'null' || audioPath === 'undefined') {
      console.log('❌ Invalid audio path:', audioPath);
      return null;
    }
    
    // If it's already a full URL, use it as is
    if (audioPath.startsWith('http')) {
      return audioPath;
    }
    
    // If it's from the upload API response, construct the full URL
    if (audioPath.includes('writable/uploads')) {
      return `https://api.emov.com.pk/${audioPath}`;
    }
    
    // Otherwise, assume it's a filename and prepend the uploads path
    return `https://api.emov.com.pk/writable/uploads/${audioPath}`;
  };

  // Handle message options click
  const handleMessageOptions = (message, e) => {
    e.stopPropagation();
    setSelectedMessage(message);
    setDeleteModalOpen(true);
  };

  // Handle delete message
  const handleDeleteMessage = async (deleteType) => {
    if (!selectedMessage || deleteLoading) return;
    
    try {
      setDeleteLoading(true);
      console.log(`🗑️ Deleting message for: ${deleteType}`);
      
      await deleteMessage(selectedMessage._id, deleteType);
      
      // Refresh the chat list to update the last message
      if (currentChat) {
        // Use loadChats from useChat hook to refresh the chat list
        await loadChats();
      }
      
      setDeleteModalOpen(false);
      setSelectedMessage(null);
      setHoveredMessage(null);
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setDeleteModalOpen(false);
    setSelectedMessage(null);
  };

  // Add this helper function for consistent image rendering
 // Update the renderImageContent function
const renderImageContent = (imageUrl) => {
  console.log('🎨 Rendering image content with URL:', imageUrl);
  
  // Ensure we have a valid URL before rendering
  const finalUrl = getImageUrl(imageUrl);
  
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">📸 Image</div>
      <div className="relative">
        <img 
          src={finalUrl} 
          alt="Shared content" 
          className="max-w-full h-auto rounded-lg max-h-60 object-contain border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
          onError={(e) => {
            console.error('❌ Image failed to load:', finalUrl);
            e.target.style.display = 'none';
            // Show fallback text
            const fallback = e.target.parentElement.querySelector('.image-fallback');
            if (fallback) fallback.style.display = 'block';
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully:', finalUrl);
          }}
        />
        <div className="image-fallback hidden text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          📸 Image not available
        </div>
      </div>
    </div>
  );
};

  // Handle chat selection
  const handleChatSelect = async (chat) => {
    console.log('💬 Chat selected:', chat);
    if (!chat) return;
    
    try {
      setMessageLoading(true);
      console.log('🔄 Setting active chat...');
      await setActiveChat(chat);
      console.log('✅ Active chat set successfully');
      
      // Clear any URL state after setting the chat
      if (location.state?.activeChatId) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    } catch (error) {
      console.error('❌ Error setting active chat:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  // Debug effect to see what's in the chats
useEffect(() => {
  if (chats.length > 0) {
    console.log('📋 Current chats state:', chats.map(chat => ({
      id: chat._id,
      lastMessage: chat.lastMessage,
      otherUser: chat.otherUser.name
    })));
  }
}, [chats]);

  // Set active chat from URL state when component mounts
  useEffect(() => {
    if (location.state?.activeChatId && chats.length > 0) {
      console.log('🔍 Looking for chat with ID:', location.state.activeChatId);
      const chat = chats.find(c => c._id === location.state.activeChatId || c.conversation_id === location.state.activeChatId);
      if (chat) {
        console.log('📍 Setting active chat from URL state:', chat);
        handleChatSelect(chat);
      } else {
        console.log('❌ Chat not found with ID:', location.state.activeChatId);
      }
    }
  }, [chats, location.state]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Mark messages as read when chat is opened
  useEffect(() => {
    if (currentChat && messages.length > 0) {
      const unreadMsgs = messages.filter(msg => !msg.read && msg.sender !== 'me').map(msg => msg._id);
      if (unreadMsgs.length > 0) {
        markMessagesAsRead(unreadMsgs);
      }
    }
  }, [currentChat, messages, markMessagesAsRead]);

  // Load chats only once when component mounts
  useEffect(() => {
    if (!initialLoadDone && !loading) {
      console.log('🔄 Initial chat load in Chats component');
      loadChats();
      setInitialLoadDone(true);
    }
  }, []);

  // Listen for chat refresh events
  useEffect(() => {
    const handleChatsRefresh = () => {
      console.log('🔄 Refreshing chats from external event');
      loadChats();
    };

    window.addEventListener('chatsRefresh', handleChatsRefresh);
    return () => {
      window.removeEventListener('chatsRefresh', handleChatsRefresh);
    };
  }, [loadChats]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fixed: Handle send message with better media handling
 const handleSendMessage = async (e) => {
  e.preventDefault();
  
  // Prevent sending if no content
  if (!newMessage.trim() && !selectedImage && !selectedAudio) {
    console.log('🚫 No content to send');
    return;
  }
  
  if (!currentChat || sendingMessage) return;
  
  try {
    setSendingMessage(true);
    
    let messageType = 'text';
    let messageContent = newMessage.trim();
    
    // Handle image upload and send
    if (selectedImage && selectedImageFile) {
      console.log('🖼️ Starting image upload and send process');
      try {
        console.log('📤 Uploading image file...');
        const imageUrl = await handleSendImage();
        
        if (imageUrl) {
          console.log('✅ Image uploaded successfully, URL:', imageUrl);
          
          // Extract just the image ID from the URL
          const imageId = imageUrl.split('/').pop();
          console.log(`📤 Sending image message with ID: ${imageId}`);
          await sendMessage(imageId, 'image');
          
          // Clear the image selection and input
          setSelectedImage(null);
          setSelectedImageFile(null);
          setNewMessage('');
          
          console.log('✅ Image message sent successfully');
          return;
        } else {
          throw new Error('Image upload was successful but no URL was returned');
        }
      } catch (error) {
        console.error('❌ Error during image upload/send:', {
          error: error.message,
          stack: error.stack,
          response: error.response?.data
        });
        
        // Reset the image selection on error
        setSelectedImage(null);
        setSelectedImageFile(null);
        
        // Show a more specific error message if available
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to send image. Please try again.';
        
        alert(errorMessage);
        return;
      }
    }
    
    // Handle audio upload and send
    if (selectedAudio && selectedAudioFile) {
      console.log('🎵 Handling audio upload and send');
      try {
        const audioUrl = await handleSendAudio();
        if (audioUrl) {
          messageType = 'audio';
          messageContent = audioUrl;
          console.log('✅ Audio ready to send:', messageContent);
          
          // Send the audio message
          console.log(`📤 Sending ${messageType} message with URL:`, messageContent);
          await sendMessage(messageContent, messageType);
          
          // Clear all states
          setNewMessage('');
          clearMediaSelection();
          console.log('✅ Audio message sent successfully');
          return;
        } else {
          throw new Error('Audio upload returned no URL');
        }
      } catch (error) {
        console.error('❌ Audio upload failed:', error);
        alert('Failed to upload audio. Please try again.');
        return;
      }
    }
    
    // Handle text message (no media)
    if (messageContent) {
      console.log(`📤 Sending text message:`, messageContent);
      await sendMessage(messageContent, messageType);
      setNewMessage('');
      console.log('✅ Text message sent successfully');
    }
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    setSendingMessage(false);
  }
};

  // Fixed: Handle image selection properly
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        // Clear any existing audio selection
        clearAudioSelection();
        
        setSelectedImage(URL.createObjectURL(file));
        setSelectedImageFile(file);
        console.log('📸 Image selected:', file.name);
      } else {
        alert('Please select a valid image file');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Fixed: Handle audio selection properly
  const handleAudioSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an audio file
      if (file.type.startsWith('audio/')) {
        // Clear any existing image selection
        clearImageSelection();
        
        setSelectedAudio(URL.createObjectURL(file));
        setSelectedAudioFile(file);
        console.log('🎵 Audio selected:', file.name);
      } else {
        alert('Please select a valid audio file');
        // Reset file input
        if (audioInputRef.current) {
          audioInputRef.current.value = '';
        }
      }
    }
  };

  // Clear image selection
  const clearImageSelection = () => {
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear audio selection
  const clearAudioSelection = () => {
    setSelectedAudio(null);
    setSelectedAudioFile(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  // Clear all media selections
  const clearMediaSelection = () => {
    clearImageSelection();
    clearAudioSelection();
  };
  
  // Fixed: Better time formatting for messages
  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      // If message is from today, show time only
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      // If message is from yesterday, show "Yesterday"
      else if (diffInHours < 48) {
        return 'Yesterday';
      }
      // If message is from this week, show day name
      else if (diffInHours < 168) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      // Otherwise show date
      else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting message time:', error);
      return '';
    }
  };

  // Fixed: Get other user info with better avatar handling
  const getOtherUser = (chat) => {
    if (!chat.otherUser) {
      console.warn('❌ No otherUser found in chat:', chat);
      return {
        name: 'Seller',
        avatar: '/default-avatar.png',
        firstLetter: 'S'
      };
    }

    const otherUser = { ...chat.otherUser };
    const displayName = otherUser.name || 'Seller';
    const firstLetter = displayName.charAt(0).toUpperCase();

    // Fix avatar URL using the centralized function
    otherUser.avatar = getImageUrl(otherUser.avatar);
    otherUser.firstLetter = firstLetter;

    console.log('👤 User info for chat:', {
      chatId: chat._id,
      name: displayName,
      avatar: otherUser.avatar,
      firstLetter: firstLetter
    });

    return {
      name: displayName,
      avatar: otherUser.avatar,
      firstLetter: firstLetter
    };
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => 
    getOtherUser(chat).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.adTitle && chat.adTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fixed: Better image URL handling in message rendering
  const renderMessageContent = (message, isCurrentUser) => {
    console.log('📨 Rendering message:', message);

    // Safe extraction with defaults
    const content = message?.content || '';
    const messageType = message?.message_type || 'text';
    
    // Ensure content is a string
    const safeContent = String(content);

    try {
      if (messageType === 'image') {
        // Check multiple possible locations for the image URL
        let imageUrl = safeContent || 
                      message?.media_url || 
                      message?.image_url || 
                      message?.message_text ||
                      message?._original?.media_url || 
                      message?._original?.image_url || 
                      message?._original?.message_text ||
                      message?.image ||
                      message?._original?.image ||
                      message?.file_url ||
                      message?._original?.file_url;
        
        console.log('🖼️ Found image URL in message object:', {
          content: message?.content,
          media_url: message?.media_url,
          image_url: message?.image_url,
          message_text: message?.message_text,
          _original: message?._original,
          final_url: imageUrl
        });
        
        // Final check if we have a valid URL
        if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null' || imageUrl === '') {
          console.log('❌ No valid image URL found in message:', message);
          return (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">📸 Image</div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                Image not available
              </div>
            </div>
          );
        }
        
        // Format the URL properly
        let formattedUrl;
        
        // If we have a full URL that includes '/image/' but not in the correct format
        if (imageUrl.includes('/image/') && !imageUrl.endsWith('.jpg') && !imageUrl.endsWith('.jpeg') && !imageUrl.endsWith('.png')) {
          // Extract the image ID from the path
          const imageId = imageUrl.split('/image/')[1]?.split('/')[0];
          if (imageId) {
            formattedUrl = `https://api.emov.com.pk/image/${imageId}`;
          } else {
            formattedUrl = imageUrl;
          }
        } 
        // If we just have an image ID
        else if (!imageUrl.includes('/') && !imageUrl.includes('.')) {
          formattedUrl = `https://api.emov.com.pk/image/${imageUrl}`;
        }
        // If it's already a full URL
        else if (imageUrl.startsWith('http')) {
          formattedUrl = imageUrl;
        }
        // For any other case, construct the URL
        else {
          const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
          formattedUrl = `https://api.emov.com.pk/image/${cleanPath}`;
        }
        
        console.log('🖼️ Rendering image with URL:', formattedUrl);
        
        // Return the image with error handling
        return (

          
          <div className="relative group">
            <div className="relative w-full max-w-xs h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={formattedUrl}
                alt="Sent image"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Error loading image:', formattedUrl);
                  e.target.onerror = null;
                  e.target.src = '/image-placeholder.png';
                  e.target.className = 'w-full h-full object-contain p-4';
                }}
              />
              {/* Delete button for image messages is now handled in the parent component */}
            </div>
          </div>
        );
      
    } else if (messageType === 'audio') {
      // Similar fix for audio messages if needed
      let audioUrl = safeContent;
      
      if (!audioUrl || audioUrl === 'undefined' || audioUrl === 'null' || audioUrl === '') {
        audioUrl = message?._original?.media_url || 
                   message?._original?.audio_url || 
                   message?._original?.message_text || // ADDED THIS LINE
                   message?.media_url ||
                   message?.audio_url ||
                   message?.message_text; // ADDED THIS LINE
      }
      
      if (!audioUrl || audioUrl === 'undefined' || audioUrl === 'null' || audioUrl === '') {
        console.log('❌ Empty audio URL in message:', message);
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">🎵 Audio</div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-500 dark:text-gray-400">
              Audio not available
            </div>
          </div>
        );
      }
      
      console.log('🎵 Rendering audio message with URL:', audioUrl);
      const finalAudioUrl = getAudioUrl(audioUrl);
      
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">🎵 Audio</div>
          <audio controls className="w-full max-w-xs">
            <source src={finalAudioUrl} type="audio/mpeg" />
            <source src={finalAudioUrl} type="audio/wav" />
            <source src={finalAudioUrl} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    } else {
      return <div className="break-words whitespace-pre-wrap">{safeContent}</div>;
    }
  } catch (error) {
    console.error('Error rendering message content:', error);
    return <div className="break-words whitespace-pre-wrap text-red-500">Error displaying message</div>;
  }
};

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          const userProfileData = {
            id: user.id || user.userId || currentUserId,
            name: user.name || 'You',
            avatar: user.profileImage || '/default-avatar.png',
            firstLetter: (user.name || 'Y').charAt(0).toUpperCase()
          };
          setUserProfile(userProfileData);
          return;
        }

        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('https://api.emov.com.pk/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = response.data.data || response.data;
          const formattedUser = {
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.imageUrl ? getImageUrl(userData.imageUrl) : null,
            username: userData.username,
            id: userData.id || userData.userId
          };
          
          localStorage.setItem('user', JSON.stringify(formattedUser));
          setUserProfile(formattedUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="flex-shrink-0 w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <svg className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Download App</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-gray-700 dark:text-gray-300 pr-6 py-2 text-sm focus:outline-none border-0 appearance-none"
              >
                <option value="english">English</option>
                <option value="urdu">Urdu</option>
              </select>
              <FaCaretDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {theme === 'dark' ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
          </div>
  
          <div className="flex items-center space-x-3">
            <button
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div className="flex-shrink-0 relative">
        <Navbar 
          theme={theme}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={setLanguage}
          userProfile={userProfile}
          handleLogout={handleLogout}
        />
      </div>
      
      {/* Header */}
      <div className="flex-shrink-0 w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          {unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <button 
          onClick={() => !loading && loadChats()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={loading}
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 mx-4 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => {}} className="text-red-700 hover:text-red-900">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar with chat list */}
        <div className={`${currentChat ? 'hidden md:flex md:w-96 flex-col' : 'w-full md:w-96 flex-col'} border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading && chats.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
                <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-center font-medium">No chats found</p>
                <p className="text-sm text-center mt-1">
                  {searchTerm ? 'Try a different search term' : 'Start a conversation by contacting a seller'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredChats.map((chat) => {
                  const otherUser = getOtherUser(chat);
                  const isUnread = chat.unreadCount > 0;
                  
                  return (
                    <div
                      key={chat._id}
                      className={`flex items-center p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 relative group ${
                        isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleChatSelect(chat)}
                      onMouseEnter={() => setHoveredChatId(chat._id)}
                      onMouseLeave={() => setHoveredChatId(null)}
                    >
                      <Avatar user={otherUser} size="lg" />
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {otherUser.name}
                          </h3>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                              {formatTimeAgo(chat.lastMessage?.createdAt)}
                            </span>
                            {hoveredChatId === chat._id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversationToDelete(chat);
                                  setIsDeleteConversationModalOpen(true);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete conversation"
                              >
                                <FaTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
<p className="text-sm text-gray-500 dark:text-gray-400 truncate">
  {chat.lastMessage ? (
    chat.lastMessage.message_type === 'image' ? (
      chat.lastMessage.sender === 'me' || chat.lastMessage.sender_id === currentUser?.id ? 
        'You sent a photo' : 'Sent a photo'
    ) : chat.lastMessage.message_type === 'audio' ? (
      chat.lastMessage.sender === 'me' || chat.lastMessage.sender_id === currentUser?.id ? 
        'You sent an audio' : 'Sent an audio'
    ) : (
      chat.lastMessage.content || 'No messages yet'
    )
  ) : 'No messages yet'}
</p>
                      </div>
                      {isUnread && (
                        <div className="ml-2 w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat area */}
        {currentChat ? (
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800">
            {/* Chat header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <Avatar user={getOtherUser(currentChat)} size="md" />
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {getOtherUser(currentChat).name}
                  </h2>
                  {currentChat.adTitle && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {currentChat.adTitle}
                    </p>
                  )}
                  {/* <p className="text-xs text-gray-500 dark:text-gray-400">Online</p> */}
                </div>
              </div>
              <div className="flex space-x-1">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0">
              {messageLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                    <span className="text-gray-500 text-sm">Loading messages...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <svg className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No messages yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-xs">
                    Send a message to start the conversation with {getOtherUser(currentChat).name}
                  </p>
                </div>
              ) : (
                <>
                  {messages.filter(message => message && message._id).map((message) => {
                    const isCurrentUser = message.sender === 'me' || message.sender === currentUserId;
                    const senderInfo = message.senderInfo || (isCurrentUser ? {
                      id: currentUserId,
                      name: userProfile?.name || 'You',
                      avatar: userProfile?.picture || '/default-avatar.png'
                    } : currentChat?.otherUser);
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 group relative`}
                        onMouseEnter={() => setHoveredMessage(message._id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        {/* Sender's avatar for received messages */}
                        {!isCurrentUser && senderInfo && (
                          <div className="flex-shrink-0 mr-2 self-end">
                            <Avatar user={senderInfo} size="sm" />
                          </div>
                        )}
                        
                        <div className={`flex flex-col max-w-xs md:max-w-md lg:max-w-lg`}>
                          {/* Sender's name for received messages */}
                          {!isCurrentUser && senderInfo && (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">
                              {senderInfo.name}
                            </span>
                          )}
                          
                          <div className="relative">
                            <div
                              className={`p-4 rounded-2xl ${
                                isCurrentUser
                                  ? 'bg-emerald-500 text-white rounded-br-none'
                                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'
                              } shadow-sm`}
                            >
                              {renderMessageContent(message, isCurrentUser)}
                              <div className={`text-xs mt-2 ${isCurrentUser ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                                {formatMessageTime(message.createdAt)}
                                {message.status === 'sending' && ' • Sending...'}
                                {message.status === 'sent' && ' • Sent'}
                                {message.status === 'failed' && ' • Failed'}
                                {message.read && isCurrentUser && ' • Read'}
                              </div>
                            </div>
                            
                            {/* Delete button - only show on hover for current user's messages */}
                            {isCurrentUser && hoveredMessage === message._id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessage(message);
                                  setDeleteModalOpen(true);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200"
                                title="Delete message"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Message input */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {/* Selected image preview */}
              {selectedImage && (
                <div className="relative mb-3 max-w-xs">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="rounded-lg max-h-40 object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={clearImageSelection}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Selected audio preview */}
              {selectedAudio && (
                <div className="relative mb-3 max-w-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaMicrophone className="text-emerald-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Audio selected</span>
                  </div>
                  <button
                    onClick={clearAudioSelection}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                {/* Image upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={sendingMessage}
                >
                  <FaImage className="w-5 h-5" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </button>

                {/* Audio upload button */}
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="flex-shrink-0 p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={sendingMessage}
                >
                  <FaMicrophone className="w-5 h-5" />
                  <input
                    type="file"
                    ref={audioInputRef}
                    onChange={handleAudioSelect}
                    accept="audio/*"
                    className="hidden"
                  />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full p-4 pr-12 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage && !selectedAudio) || sendingMessage}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                      (newMessage.trim() || selectedImage || selectedAudio) && !sendingMessage
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaPaperPlane className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 min-h-0">
            <div className="text-center p-8 max-w-md">
              <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No chat selected</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Select a chat from the sidebar or start a new conversation</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-colors"
              >
                Browse Ads
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Message Modal */}
{deleteModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Delete Message
        </h3>
        <button
          onClick={handleCloseModal}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          disabled={deleteLoading}
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Are you sure you want to delete this message?
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => handleDeleteMessage("me")}
          disabled={deleteLoading}
          className="w-full flex items-center justify-center space-x-3 p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <FaUserSlash className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">Delete for Me</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Remove this message from your chat only
            </div>
          </div>
        </button>
        
        <button
          onClick={() => handleDeleteMessage("everyone")}
          disabled={deleteLoading}
          className="w-full flex items-center justify-center space-x-3 p-3 text-left border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <FaTrash className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">Delete for Everyone</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Remove this message for everyone
            </div>
          </div>
        </button>
      </div>
      
      {deleteLoading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          <span className="ml-2 text-sm text-gray-500">Deleting...</span>
        </div>
      )}
    </div>
  </div>
)}

      {/* Delete Conversation Confirmation Modal */}
      {isDeleteConversationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Conversation
              </h3>
              <button
                onClick={() => {
                  setIsDeleteConversationModalOpen(false);
                  setConversationToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isDeletingConversation}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteConversationModalOpen(false);
                  setConversationToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                disabled={isDeletingConversation}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                disabled={isDeletingConversation}
              >
                {isDeletingConversation ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}