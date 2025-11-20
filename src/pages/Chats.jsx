import React, { useState, useEffect, useRef } from 'react';
import { FaCaretDown, FaSun, FaMoon, FaPaperPlane, FaImage, FaTimes, FaSearch } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import axios from 'axios';

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
    loading,
    error,
    currentUserId
  } = useChat();
  const [language, setLanguage] = useState('english');
  const [userProfile, setUserProfile] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messageLoading, setMessageLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !currentChat || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      console.log('📤 Sending message:', newMessage);
      
      await sendMessage(newMessage);
      setNewMessage('');
      setSelectedImage(null);
      
      console.log('✅ Message sent successfully');
      
      // Reload messages to see the updated conversation
      setTimeout(() => {
        if (currentChat) {
          console.log('🔄 Reloading messages after send');
          setActiveChat(currentChat); // This will reload messages
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };
  
  // FIXED: Proper image URL handling
  const getOtherUser = (chat) => {
    if (!chat.otherUser) {
      return {
        name: 'Seller',
        avatar: '/default-avatar.png'
      };
    }

    const otherUser = { ...chat.otherUser };

    // Fix avatar URL - handle different URL formats
    if (otherUser.avatar) {
      if (otherUser.avatar.startsWith('http')) {
        // Already a full URL, use as is
        console.log('🌐 Using full avatar URL:', otherUser.avatar);
      } else if (otherUser.avatar.startsWith('/')) {
        // Relative path, prepend base URL
        otherUser.avatar = `https://api.emov.com.pk${otherUser.avatar}`;
        console.log('🔗 Converted relative avatar URL:', otherUser.avatar);
      } else {
        // Just a filename, use image endpoint
        const imagePath = otherUser.avatar.replace(/^\/|\/$/g, '');
        otherUser.avatar = `https://api.emov.com.pk/image/${imagePath}`;
        console.log('📷 Using image endpoint URL:', otherUser.avatar);
      }
    } else {
      otherUser.avatar = '/default-avatar.png';
      console.log('👤 Using default avatar');
    }

    return {
      name: otherUser.name || 'Seller',
      avatar: otherUser.avatar
    };
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => 
    getOtherUser(chat).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.adTitle && chat.adTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          const formattedUser = {
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.picture || userData.imageUrl ? 
              `https://api.emov.com.pk/${(userData.picture || userData.imageUrl).replace(/^\//, '')}` : null,
            username: userData.username,
            id: userData.id || userData.userId
          };
          setUserProfile(formattedUser);
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
            picture: userData.imageUrl ? `https://api.emov.com.pk/${userData.imageUrl.replace(/^\//, '')}` : null,
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
            <button className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors">
              Sign In
            </button>
            <button className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors">
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
                {filteredChats.map(chat => (
                  <div
                    key={chat._id || chat.conversation_id}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 cursor-pointer transition-colors ${
                      (currentChat?._id === chat._id || currentChat?.conversation_id === chat.conversation_id) 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getOtherUser(chat).avatar}
                          alt={getOtherUser(chat).name}
                          className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                          onError={(e) => {
                            console.error('❌ Error loading avatar:', e.target.src);
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.png';
                          }}
                          onLoad={(e) => {
                            console.log('✅ Avatar loaded successfully:', e.target.src);
                          }}
                        />
                        {chat.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {getOtherUser(chat).name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {formatDate(chat.updatedAt)}
                          </span>
                        </div>
                        {chat.adTitle && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 truncate font-medium">
                            {chat.adTitle}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                <img
                  src={getOtherUser(currentChat).avatar}
                  alt={getOtherUser(currentChat).name}
                  className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                  onError={(e) => {
                    console.error('❌ Error loading chat header avatar:', e.target.src);
                    e.target.src = '/default-avatar.png';
                  }}
                  onLoad={(e) => {
                    console.log('✅ Chat header avatar loaded:', e.target.src);
                  }}
                />
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {getOtherUser(currentChat).name}
                  </h2>
                  {currentChat.adTitle && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {currentChat.adTitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
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
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-2xl ${
                          message.sender === 'me'
                            ? 'bg-emerald-500 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'
                        } shadow-sm`}
                      >
                        <div className="break-words">{message.content}</div>
                        <div className={`text-xs mt-2 ${message.sender === 'me' ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                          {formatTime(message.createdAt)}
                          {message.status === 'sending' && ' • Sending...'}
                          {message.status === 'sent' && ' • Sent'}
                          {message.status === 'failed' && ' • Failed'}
                          {message.read && message.sender === 'me' && ' • Read'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Message input */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {selectedImage && (
                <div className="relative mb-3 max-w-xs">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="rounded-lg max-h-40 object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
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
                    disabled={(!newMessage.trim() && !selectedImage) || sendingMessage}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                      (newMessage.trim() || selectedImage) && !sendingMessage
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
    </div>
  );
}