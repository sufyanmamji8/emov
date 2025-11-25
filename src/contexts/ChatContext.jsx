import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';

const ChatContext = createContext();

// Helper function to get current time in Pakistan timezone
const getPakistanTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
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

  // Transform API response to UI format - FIXED: Proper user identification
  const transformChatsData = (apiData) => {
    console.log(' Transforming chats data from API:', apiData);
    
    let conversationsArray = [];
    
    if (Array.isArray(apiData)) {
      conversationsArray = apiData;
    } else if (apiData?.conversations) {
      conversationsArray = apiData.conversations;
    } else if (apiData?.data) {
      conversationsArray = Array.isArray(apiData.data) ? apiData.data : [];
    } else {
      console.log(' No conversations data found in API response format');
      return [];
    }

    return conversationsArray.map(conv => {
      console.log(' Processing conversation:', conv);
      
      // Convert currentUserId to number for proper comparison
      const currentUserNum = parseInt(currentUserId);
      const user1Num = parseInt(conv.user1_id);
      const user2Num = parseInt(conv.user2_id);
      
      // Determine who is the other user (the one you're chatting with)
      const isUser1 = currentUserNum === user1Num;
      const isUser2 = currentUserNum === user2Num;
      
      console.log(' User identification:', {
        currentUserId: currentUserNum,
        user1_id: user1Num,
        user2_id: user2Num,
        isUser1,
        isUser2
      });

      let otherUserId, otherUserName, otherUserImage;
      
      if (isUser1) {
        // Current user is user1, so other user is user2 (SELLER)
        otherUserId = conv.user2_id;
        otherUserName = conv.user2_name || conv.user1_name || 'Seller';
        otherUserImage = conv.user2_imageUrl || conv.user1_imageUrl;
      } else if (isUser2) {
        // Current user is user2, so other user is user1 (SELLER)
        otherUserId = conv.user1_id;
        otherUserName = conv.user1_name || conv.user2_name || 'Seller';
        otherUserImage = conv.user1_imageUrl || conv.user2_imageUrl;
      } else {
        // Fallback - use the one that's NOT current user
        console.warn(' Current user not found in conversation participants, using fallback');
        otherUserId = currentUserNum === user1Num ? user2Num : user1Num;
        otherUserName = (currentUserNum === user1Num ? conv.user2_name : conv.user1_name) || 'Seller';
        otherUserImage = currentUserNum === user1Num ? conv.user2_imageUrl : conv.user1_imageUrl;
      }

      // Format image URL
      const formatImageUrl = (url) => {
        if (!url || url === 'N/A' || url === 'null' || url === 'undefined' || url === '') {
          return null;
        }
        if (url.startsWith('http')) {
          // Convert to correct path if needed
          return url.includes('/writable/uploads/') 
            ? url.replace('/writable/uploads/', '/image/uploads/')
            : url;
        }
        return `https://api.emov.com.pk/image/uploads/${url}`;
      };

      const otherUserAvatar = formatImageUrl(otherUserImage);
      const displayName = otherUserName || 'Seller';
      const firstLetter = displayName.charAt(0).toUpperCase();

      console.log(' Final user info:', {
        currentUser: currentUserNum,
        otherUser: {
          id: otherUserId,
          name: displayName,
          avatar: otherUserAvatar,
          firstLetter: firstLetter
        }
      });

      return {
        _id: conv.conversation_id || conv.id || conv._id,
        conversation_id: conv.conversation_id || conv.id,
        otherUser: {
          id: otherUserId,
          name: displayName,
          avatar: otherUserAvatar,
          firstLetter: firstLetter
        },
        lastMessage: {
          content: conv.last_message || conv.last_message_text || 'No messages yet',
          createdAt: conv.last_message_time || conv.updated_at || conv.created_at || getPakistanTime().toISOString(),
          message_type: conv.last_message_type || 'text',
          sender: conv.last_message_sender_id === currentUserId.toString() ? 'me' : 'other',
          sender_id: conv.last_message_sender_id
        },
        updatedAt: conv.updated_at || conv.last_message_time || conv.created_at || getPakistanTime().toISOString(),
        unreadCount: conv.unread_count || 0,
        adTitle: conv.ad_title || 'Vehicle',
        adImage: formatImageUrl(conv.ad_image),
        // Store both users for debugging
        _debug: {
          user1: { id: conv.user1_id, name: conv.user1_name },
          user2: { id: conv.user2_id, name: conv.user2_name },
          currentUserId: currentUserNum
        }
      };
    });
  };

  // Load all chats for the current user
  const loadChats = useCallback(async () => {
    if (!currentUserId) {
      console.log(' No current user ID available');
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log(' Loading chats for user:', currentUserId);
      
      const data = await chatService.getChats(currentUserId);
      console.log(' Raw chats data from API:', data);
      
      const transformedChats = transformChatsData(data);
      setChats(transformedChats);
      setHasLoaded(true);
      
      const totalUnread = transformedChats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
      console.log(' Chats loaded successfully:', transformedChats.length, 'chats');
      return transformedChats;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load chats';
      setError(errorMsg);
      console.error(' Error loading chats:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Start a new chat - FIXED: Now properly refreshes chat list
  const startNewChat = async (adId, message, user2Id) => {
    try {
      setLoading(true);
      setError(null);
      console.log(' Starting new chat with adId:', adId, 'message:', message, 'user2Id:', user2Id);
      
      const newChat = await chatService.startConversation(adId, message, user2Id);
      console.log(' New chat created:', newChat);
      
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
      console.error(' Error in startNewChat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
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
        _original: msg // Store original data for debugging
      };
    });
  };

  // Format image URLs properly
  const formatImageUrl = (url) => {
    if (!url || url === 'N/A' || url === 'null' || url === 'undefined' || url === '') {
      return null;
    }
    if (url.startsWith('http')) return url;
    return `https://api.emov.com.pk${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Load messages with retry logic and better error handling
  const loadMessages = useCallback(async (chatId, retryCount = 0) => {
    if (!chatId) {
      console.error('No chat ID provided to loadMessages');
      return [];
    }
    
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second
    
    try {
      console.log(`🔄 Loading messages for chat: ${chatId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      const data = await chatService.getMessages(chatId);
      console.log('✅ Successfully loaded messages:', data);
      
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
      console.log('✅ Transformed messages:', transformedMessages);
      return transformedMessages;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load messages';
      console.error(`❌ Error in loadMessages (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for transient errors (like 500)
      if (retryCount < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadMessages(chatId, retryCount + 1);
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

  // Send message function
  const sendMessage = async (content, messageType = 'text') => {
    if (!currentChat) {
      throw new Error('No active chat selected');
    }
    
    const tempId = `temp-${Date.now()}`;
    const currentUser = {
      id: user.id || user.userId,
      name: user.name || 'You',
      avatar: user.profileImage || '/default-avatar.png'
    };
    
    const messageContent = content;
    
    // Create temporary message with current time in Pakistan timezone
    const message = {
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

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await chatService.sendMessage(
        currentChat.conversation_id || currentChat._id, 
        messageContent,
        currentUser.id,
        messageType
      );
      
      console.log(' Message sent to API, response:', response);
      
      // Use server's timestamp if available, otherwise use our Pakistan time
      const serverTime = response.createdAt || getPakistanTime().toISOString();
      
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
        createdAt: serverTime,
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
      
      // Update the chat's last message
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat._id === currentChat._id || chat.conversation_id === currentChat.conversation_id) {
            return {
              ...chat,
              lastMessage: {
                content: messageType === 'image' ? 'Image' : messageContent,
                message_type: messageType,
                sender: 'me',
                sender_id: currentUser.id,
                createdAt: serverTime
              },
              updatedAt: serverTime
            };
          }
          return chat;
        })
      );
      
      // Reload messages to ensure consistency
      setTimeout(async () => {
        const updatedMessages = await loadMessages(currentChat.conversation_id || currentChat._id);
        setMessages(updatedMessages);
      }, 500);
      
      return newMessage;
    } catch (err) {
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message';
      setError(errorMsg);
      console.error('Error sending message:', err);
      throw err;
    }
  };

  // Set the current active chat - FIXED: Better error handling
  const setActiveChat = useCallback(async (chat) => {
    console.log(' Setting active chat:', chat);
    
    // Always set the current chat first for immediate UI response
    setCurrentChat(chat);
    setMessages([]);
    
    if (chat) {
      try {
        console.log('🔄 Loading messages for new chat...');
        const loadedMessages = await loadMessages(chat.conversation_id || chat._id);
        setMessages(loadedMessages);
        
        // Mark messages as read when chat is opened
        const unreadMsgs = loadedMessages.filter(msg => !msg.read && msg.sender !== 'me').map(msg => msg._id);
        if (unreadMsgs.length > 0) {
          await markMessagesAsRead(unreadMsgs);
        }
      } catch (error) {
        console.error('Error loading messages for chat:', error);
        // Set empty messages even if there's an error
        setMessages([]);
      }
    }
  }, [loadMessages, markMessagesAsRead]);

  // Load chats when user ID changes
  useEffect(() => {
    if (currentUserId && !hasLoaded) {
      console.log('🔄 Initial chat load triggered');
      loadChats();
    }
  }, [currentUserId, hasLoaded, loadChats]);

  // Delete a conversation
  const deleteConversation = async (chatId) => {
    try {
      await chatService.deleteConversation(chatId);
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
        currentUserId
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