import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';

const ChatContext = createContext();

// In-memory caches
const messageCache = new Map(); // chatId -> messages array
const imageUrlCache = new Map(); // original URL -> formatted URL

// Helper function to get current time in Pakistan timezone
const getPakistanTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
};

const toPakistanTime = (dateString) => {
  if (!dateString) {
    return getPakistanTime();
  }

  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    return getPakistanTime();
  }

  const karachiString = parsed.toLocaleString('en-US', {
    timeZone: 'Asia/Karachi'
  });
  return new Date(karachiString);
};

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Get current user ID from localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setCurrentUserId(userData.id || userData.userId || '16');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setCurrentUserId('16');
      }
    }
  }, []);

  // Delete message function
  const deleteMessage = async (messageId, deleteType = "me") => {
    try {
      // Remove message from UI immediately
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      // Invalidate cache for current chat
      if (currentChat) {
        const chatId = currentChat.conversation_id || currentChat._id;
        messageCache.delete(chatId);
      }
      
      // Call API to delete message
      await chatService.deleteMessage([messageId], deleteType);
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      
      // Reload messages to restore the deleted message if API call failed
      if (currentChat) {
        const chatId = currentChat.conversation_id || currentChat._id;
        messageCache.delete(chatId); // Clear cache before reload
        const updatedMessages = await loadMessages(chatId);
        setMessages(updatedMessages);
      }
      
      throw error;
    }
  };

  // Format image URLs properly with caching
  const formatImageUrl = (url) => {
    if (!url || url === 'N/A' || url === 'null' || url === 'undefined' || url === '') {
      return null;
    }
    
    // Check cache first
    if (imageUrlCache.has(url)) {
      return imageUrlCache.get(url);
    }
    
    // Format URL
    let formattedUrl;
    if (url.startsWith('http')) {
      formattedUrl = url;
    } else {
      formattedUrl = `https://api.emov.com.pk${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    // Cache the result
    imageUrlCache.set(url, formattedUrl);
    return formattedUrl;
  };

  // Helper function to transform messages with proper image URL handling
  const transformMessages = (messages, currentUserId) => {
    if (!Array.isArray(messages)) return [];
    
    return messages.map(msg => {
      // Extract content from different possible fields
      let content = msg.message_text || msg.content || '';
      const messageType = msg.message_type || 'text';
      
      // Handle image messages
      if (messageType === 'image' || messageType === 'file') {
        // Check multiple possible locations for the image URL
        const imageUrl = msg.media_url || msg.image_url || msg.file_url || 
                        (messageType === 'image' ? content : '');
        
        // If we found an image URL, use it as the content
        if (imageUrl) {
          content = imageUrl;
        }
      }

      // Format the image URL if it's an image message
      if (messageType === 'image' && content) {
        content = formatImageUrl(content);
      }

      // Determine if the message is from the current user
      const isFromCurrentUser = parseInt(msg.sender_id) === parseInt(currentUserId);
      
      return {
        _id: msg.id || msg.message_id || `temp-${Date.now()}-${Math.random()}`,
        message_id: msg.id || msg.message_id,
        content: content,
        sender: isFromCurrentUser ? 'me' : 'other',
        sender_id: msg.sender_id,
        createdAt: msg.created_at || msg.timestamp || getPakistanTime().toISOString(),
        message_type: messageType,
        _original: msg
      };
    });
  };

  // Transform API response to UI format - Grouped by other user ID
  const transformChatsData = (apiData) => {
    let conversationsArray = [];
    
    if (Array.isArray(apiData)) {
      conversationsArray = apiData;
    } else if (apiData?.conversations) {
      conversationsArray = apiData.conversations;
    } else if (apiData?.data) {
      conversationsArray = Array.isArray(apiData.data) ? apiData.data : [];
    } else {
      return [];
    }

    // Group conversations by other user ID
    const chatsByUser = {};
    
    conversationsArray.forEach(conv => {
      // Convert currentUserId to number for proper comparison
      const currentUserNum = parseInt(currentUserId);
      const user1Num = parseInt(conv.user1_id);
      const user2Num = parseInt(conv.user2_id);
      
      // Determine who is the other user (the one you're chatting with)
      const isUser1 = currentUserNum === user1Num;
      const isUser2 = currentUserNum === user2Num;
      
      let otherUserId, otherUserName, otherUserAvatar;
      
      if (isUser1) {
        otherUserId = conv.user2_id;
        otherUserName = conv.user2_name || 'User';
        otherUserAvatar = conv.user2_imageUrl || '/default-avatar.png';
      } else if (isUser2) {
        otherUserId = conv.user1_id;
        otherUserName = conv.user1_name || 'User';
        otherUserAvatar = conv.user1_imageUrl || '/default-avatar.png';
      } else {
        // Skip if current user is not in the conversation
        return;
      }
      
      // Determine message content and type
      const messageType = conv.last_message_type || 'text';
      let messageContent = conv.last_message || '';
      const isFromCurrentUser = parseInt(conv.last_message_sender_id) === currentUserNum;
      
      let lastMessageContent = messageContent;
      
      // Handle different message types
      if (messageType === 'image') {
        lastMessageContent = isFromCurrentUser ? 'You sent a photo' : 'Sent a photo';
      } else if (messageType === 'audio') {
        lastMessageContent = isFromCurrentUser ? 'You sent an audio' : 'Sent an audio';
      } else if (messageType === 'file') {
        lastMessageContent = isFromCurrentUser ? 'You sent a file' : 'Sent a file';
      } else if (messageType === 'text') {
        // Only modify if it's from current user, otherwise show the actual message
        lastMessageContent = isFromCurrentUser ? `You: ${messageContent}` : messageContent;
      }

      // Create or update chat for this user
      if (!chatsByUser[otherUserId]) {
        chatsByUser[otherUserId] = {
          _id: `user_${otherUserId}`,
          conversation_id: conv.conversation_id || conv.id,
          otherUser: {
            id: otherUserId,
            name: otherUserName,
            avatar: otherUserAvatar,
            firstLetter: otherUserName ? otherUserName.charAt(0).toUpperCase() : 'U'
          },
          lastMessage: {
            content: lastMessageContent,
            createdAt: conv.last_message_time || conv.updated_at || conv.created_at || getPakistanTime().toISOString(),
            message_type: messageType,
            sender: isFromCurrentUser ? 'me' : 'other',
            sender_id: conv.last_message_sender_id
          },
          updatedAt: conv.updated_at || conv.last_message_time || conv.created_at || getPakistanTime().toISOString(),
          unreadCount: conv.unread_count || 0,
          adTitle: conv.ad_title || 'Vehicle',
          adImage: formatImageUrl(conv.ad_image)
        };
      } else {
        // Update existing chat if this message is more recent
        const existingChat = chatsByUser[otherUserId];
        const currentMessageTime = new Date(conv.last_message_time || conv.updated_at || conv.created_at || getPakistanTime().toISOString());
        const existingMessageTime = new Date(existingChat.lastMessage.createdAt);
        
        if (currentMessageTime > existingMessageTime) {
          existingChat.lastMessage = {
            content: lastMessageContent,
            createdAt: conv.last_message_time || conv.updated_at || conv.created_at || getPakistanTime().toISOString(),
            message_type: messageType,
            sender: isFromCurrentUser ? 'me' : 'other',
            sender_id: conv.last_message_sender_id
          };
          existingChat.updatedAt = conv.updated_at || conv.last_message_time || conv.created_at || getPakistanTime().toISOString();
          existingChat.unreadCount = (existingChat.unreadCount || 0) + (conv.unread_count || 0);
        }
      }
    });
    
    // Convert to array and sort by last message time
    const result = Object.values(chatsByUser).sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
    
    return result;
  };

  // Load all chats for the current user
  const loadChats = useCallback(async () => {
    if (!currentUserId) {
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await chatService.getChats(currentUserId);
      const transformedChats = transformChatsData(data);
      setChats(transformedChats);
      setHasLoaded(true);
      
      const totalUnread = transformedChats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
      return transformedChats;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load chats';
      setError(errorMsg);
      console.error('Error loading chats:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Start a new chat
  const startNewChat = async (adId, message, user2Id) => {
    try {
      setLoading(true);
      setError(null);
      
      const newChat = await chatService.startConversation(adId, message, user2Id);
      
      // Create temporary chat for immediate UI response
      const tempChat = {
        _id: newChat.conversation_id,
        conversation_id: newChat.conversation_id,
        otherUser: {
          id: user2Id,
          name: 'Seller',
          avatar: '/default-avatar.png',
          firstLetter: 'S'
        },
        lastMessage: {
          content: message,
          createdAt: getPakistanTime().toISOString(),
          message_type: 'text',
          sender: 'me',
          sender_id: currentUserId
        },
        updatedAt: getPakistanTime().toISOString(),
        unreadCount: 0,
        adTitle: 'New Conversation',
        isNew: true
      };
      
      // Add temporary chat and refresh the list
      setChats(prev => [tempChat, ...prev]);
      
      // Reload chats to get the actual data from server
      setTimeout(() => {
        loadChats();
      }, 1000);
      
      return newChat;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to start chat';
      setError(errorMsg);
      console.error('Error in startNewChat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load messages with caching and retry logic
  const loadMessages = useCallback(async (chatId, retryCount = 0, forceRefresh = false) => {
    if (!chatId) {
      console.error('No chat ID provided to loadMessages');
      return [];
    }
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && messageCache.has(chatId)) {
      return messageCache.get(chatId);
    }
    
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000;
    
    try {
      const data = await chatService.getMessages(chatId);
      
      // Reset error state on success
      setError(null);
      
      // Handle both array and object response formats
      let messagesArray = [];
      if (Array.isArray(data)) {
        messagesArray = data;
      } else if (data.messages && Array.isArray(data.messages)) {
        messagesArray = data.messages;
      } else if (data.data && Array.isArray(data.data)) {
        messagesArray = data.data;
      } else {
        messagesArray = [];
      }
      
      // Transform messages with proper image URL handling
      const transformedMessages = transformMessages(messagesArray, currentUserId);
      
      // Cache the transformed messages
      messageCache.set(chatId, transformedMessages);
      
      return transformedMessages;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load messages';
      
      // Retry logic for transient errors (like 500)
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadMessages(chatId, retryCount + 1, forceRefresh);
      }
      
      // Only show error if we've exhausted all retries
      if (retryCount >= MAX_RETRIES) {
        setError('Unable to load messages. Please try again later.');
      }
      
      // Return empty array to prevent UI from breaking
      return [];
    }
  }, [currentUserId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    
    try {
      await chatService.markMessagesAsRead(messageIds);
      
      // Update messages in the current chat
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update cache
      if (currentChat) {
        const chatId = currentChat.conversation_id || currentChat._id;
        if (messageCache.has(chatId)) {
          const cachedMessages = messageCache.get(chatId);
          const updatedCache = cachedMessages.map(msg =>
            messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          );
          messageCache.set(chatId, updatedCache);
        }
      }
      
      // Update unread count in chats list
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat._id === currentChat?._id || chat.conversation_id === currentChat?.conversation_id) {
            const unreadCount = chat.unreadCount ? Math.max(0, chat.unreadCount - messageIds.length) : 0;
            return { ...chat, unreadCount };
          }
          return chat;
        })
      );
      
      // Update total unread count
      setUnreadCount(prev => Math.max(0, prev - messageIds.length));
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [currentChat]);

  // Send message function - OPTIMIZED: No longer reloads all messages
  const sendMessage = async (content, messageType = 'text') => {
    if (!currentChat) {
      throw new Error('No active chat selected');
    }
    
    // Get current user from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUser = {
      id: userData.id || userData.userId || currentUserId,
      name: userData.name || 'You',
      avatar: userData.profileImage || userData.avatar || '/default-avatar.png'
    };

    if (!currentUser.id) {
      throw new Error('User not authenticated');
    }

    const tempId = `temp-${Date.now()}`;
    const messageContent = content;
    const chatId = currentChat.conversation_id || currentChat._id;
    
    // Create temporary message with current time in Pakistan timezone
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender: currentUser.id,
      senderInfo: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      createdAt: getPakistanTime().toISOString(),
      status: 'sending',
      message_type: messageType,
      read: false
    };

    // Add to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Update cache immediately with temp message
    if (messageCache.has(chatId)) {
      const cachedMessages = messageCache.get(chatId);
      messageCache.set(chatId, [...cachedMessages, tempMessage]);
    }

    try {
      const response = await chatService.sendMessage(
        chatId, 
        messageContent,
        currentUser.id,
        messageType
      );
      
      // Use server's timestamp if available, otherwise use our Pakistan time
      const serverTime = response.createdAt || getPakistanTime().toISOString();
      const normalizedServerTime = toPakistanTime(serverTime).toISOString();

      const newMessage = {
        _id: response.message_id || response.id || tempId,
        message_id: response.message_id || response.id,
        content: messageContent,
        sender: currentUser.id,
        senderInfo: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        createdAt: normalizedServerTime,
        status: 'sent',
        read: false,
        message_type: messageType
      };
      
      // Update the temporary message with the actual server response
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? newMessage : msg
        )
      );
      
      // Update cache with real message
      if (messageCache.has(chatId)) {
        const cachedMessages = messageCache.get(chatId);
        const updatedCache = cachedMessages.map(msg =>
          msg._id === tempId ? newMessage : msg
        );
        messageCache.set(chatId, updatedCache);
      }
      
      // Update the chat's last message
      setChats(prevChats => 
        prevChats.map(chat => {
          const currentChatId = chat.conversation_id || chat._id;
          
          if (currentChatId === chatId) {
            let lastMessageContent = messageContent;
            if (messageType === 'image') {
              lastMessageContent = 'You sent a photo';
            } else if (messageType === 'audio') {
              lastMessageContent = 'You sent an audio';
            } else if (messageType === 'file') {
              lastMessageContent = 'You sent a file';
            } else if (messageType === 'text') {
              lastMessageContent = 'You sent a message';
            }
            
            return {
              ...chat,
              lastMessage: {
                content: lastMessageContent,
                message_type: messageType,
                sender: 'me',
                sender_id: currentUser.id,
                createdAt: normalizedServerTime
              },
              updatedAt: normalizedServerTime,
              unreadCount: 0
            };
          }
          return chat;
        })
      );
      
      // Update the current chat in state if needed
      setCurrentChat(prev => {
        if (!prev) return null;
        let lastMessageContent = messageContent;
        if (messageType === 'image') {
          lastMessageContent = 'You sent a photo';
        } else if (messageType === 'audio') {
          lastMessageContent = 'You sent an audio';
        } else if (messageType === 'file') {
          lastMessageContent = 'You sent a file';
        } else if (messageType === 'text') {
          lastMessageContent = 'You sent a message';
        }
        
        return {
          ...prev,
          lastMessage: {
            content: lastMessageContent,
            message_type: messageType,
            sender: 'me',
            sender_id: currentUser.id,
            createdAt: serverTime
          },
          updatedAt: serverTime
        };
      });
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      // Update cache with failed status
      if (messageCache.has(chatId)) {
        const cachedMessages = messageCache.get(chatId);
        const updatedCache = cachedMessages.map(msg =>
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        );
        messageCache.set(chatId, updatedCache);
      }
      
      throw new Error('Failed to send message. Please try again.');
    }
  };

  // Set the current active chat - OPTIMIZED: Uses cache
  const setActiveChat = useCallback(async (chat) => {
    // Always set the current chat first for immediate UI response
    setCurrentChat(chat);
    
    if (chat) {
      const chatId = chat.conversation_id || chat._id;
      
      // Check cache first for instant load
      if (messageCache.has(chatId)) {
        const cachedMessages = messageCache.get(chatId);
        setMessages(cachedMessages);
        
        // Mark messages as read when chat is opened
        const unreadMsgs = cachedMessages.filter(msg => !msg.read && msg.sender !== 'me').map(msg => msg._id);
        if (unreadMsgs.length > 0) {
          await markMessagesAsRead(unreadMsgs);
        }
      } else {
        // Load from API if not cached
        setMessages([]);
        try {
          const loadedMessages = await loadMessages(chatId);
          setMessages(loadedMessages);
          
          // Mark messages as read when chat is opened
          const unreadMsgs = loadedMessages.filter(msg => !msg.read && msg.sender !== 'me').map(msg => msg._id);
          if (unreadMsgs.length > 0) {
            await markMessagesAsRead(unreadMsgs);
          }
        } catch (error) {
          console.error('Error loading messages for chat:', error);
          setMessages([]);
        }
      }
    } else {
      setMessages([]);
    }
  }, [loadMessages, markMessagesAsRead]);

  // Load chats when user ID changes (disabled here; chat screens load explicitly)
  useEffect(() => {
    if (false && currentUserId && !hasLoaded) {
      loadChats();
    }
  }, [currentUserId, hasLoaded, loadChats]);

  // Delete a conversation
  const deleteConversation = async (chatId) => {
    try {
      await chatService.deleteConversation(chatId);
      
      // Clear from cache
      messageCache.delete(chatId);
      
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete conversation';
      setError(errorMsg);
      throw err;
    }
  };

  // Optional: Clear cache function (can be called when needed)
  const clearCache = useCallback(() => {
    messageCache.clear();
    imageUrlCache.clear();
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        messages,
        unreadCount,
        loading,
        error,
        loadChats,
        startNewChat,
        sendMessage,
        setActiveChat,
        markMessagesAsRead,
        deleteConversation,
        deleteMessage, 
        currentUserId,
        clearCache // Export if you want to manually clear cache
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;