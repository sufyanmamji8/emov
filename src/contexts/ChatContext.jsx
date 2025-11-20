import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';

const ChatContext = createContext();

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

  // Transform API response to UI format
  const transformChatsData = (apiData) => {
    console.log('🔄 Transforming chats data from API:', apiData);
    
    let conversationsArray = [];
    
    if (Array.isArray(apiData)) {
      conversationsArray = apiData;
    } else if (apiData && apiData.conversations) {
      conversationsArray = apiData.conversations;
    } else if (apiData && Array.isArray(apiData.data)) {
      conversationsArray = apiData.data;
    } else {
      console.log('❌ No conversations data found in API response format');
      return [];
    }

    console.log('📊 Conversations array:', conversationsArray);

    return conversationsArray.map(conv => {
      const currentUserIsUser1 = currentUserId && (conv.user1_id == currentUserId);
      const otherUserId = currentUserIsUser1 ? conv.user2_id : conv.user1_id;
      const otherUserName = currentUserIsUser1 ? 
        (conv.user2_name || 'Seller') : 
        (conv.user1_name || 'Seller');
      
      // Fix avatar URL handling
      let avatarUrl = '/default-avatar.png';
      if (currentUserIsUser1 && conv.user2_imageUrl) {
        avatarUrl = conv.user2_imageUrl.startsWith('http') 
          ? conv.user2_imageUrl 
          : `https://api.emov.com.pk${conv.user2_imageUrl.startsWith('/') ? '' : '/'}${conv.user2_imageUrl}`;
      } else if (!currentUserIsUser1 && conv.user1_imageUrl) {
        avatarUrl = conv.user1_imageUrl.startsWith('http')
          ? conv.user1_imageUrl
          : `https://api.emov.com.pk${conv.user1_imageUrl.startsWith('/') ? '' : '/'}${conv.user1_imageUrl}`;
      }
      
      const adTitle = conv.ad_title || conv.vehicle_name || conv.title || 'Vehicle';
      const lastMessageContent = conv.last_message || conv.last_message_text || 'No messages yet';
      const lastMessageTime = conv.last_message_time || conv.updated_at || conv.created_at || new Date().toISOString();
      
      return {
        _id: conv.conversation_id || conv.id || conv._id,
        conversation_id: conv.conversation_id || conv.id,
        otherUser: {
          id: otherUserId,
          name: otherUserName,
          avatar: avatarUrl
        },
        lastMessage: {
          content: lastMessageContent,
          createdAt: lastMessageTime
        },
        updatedAt: lastMessageTime,
        unreadCount: conv.unread_count || conv.unreadCount || 0,
        adTitle: adTitle
      };
    });
  };

  // Load all chats for the current user
  const loadChats = useCallback(async () => {
    if (!currentUserId) {
      console.log('❌ No current user ID available');
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('📞 Loading chats for user:', currentUserId);
      
      const data = await chatService.getChats(currentUserId);
      console.log('📥 Raw chats data from API:', data);
      
      const transformedChats = transformChatsData(data);
      setChats(transformedChats);
      setHasLoaded(true);
      
      const totalUnread = transformedChats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
      console.log('✅ Chats loaded successfully:', transformedChats.length, 'chats');
      return transformedChats;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load chats';
      setError(errorMsg);
      console.error('💥 Error loading chats:', err);
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
      console.log('🚀 Starting new chat with adId:', adId, 'message:', message, 'user2Id:', user2Id);
      
      const newChat = await chatService.startConversation(adId, message, user2Id);
      console.log('🎉 New chat created:', newChat);
      
      const tempChat = {
        _id: newChat.conversation_id,
        conversation_id: newChat.conversation_id,
        otherUser: {
          id: user2Id,
          name: 'Seller',
          avatar: '/default-avatar.png'
        },
        lastMessage: {
          content: message,
          createdAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
        adTitle: 'New Conversation',
        isNew: true
      };
      
      setChats(prev => [tempChat, ...prev]);
      return newChat;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to start chat';
      setError(errorMsg);
      console.error('💥 Error in startNewChat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a specific chat
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return [];
    
    try {
      console.log('📩 Loading messages for chat:', chatId);
      
      const data = await chatService.getMessages(chatId);
      console.log('📥 Raw messages data:', data);
      
      const transformedMessages = data.messages?.map(msg => ({
        _id: msg.message_id || msg.id,
        message_id: msg.message_id,
        content: msg.message_text || msg.content,
        sender: msg.sender_id == currentUserId ? 'me' : 'other',
        sender_id: msg.sender_id,
        createdAt: msg.timestamp || msg.created_at || new Date().toISOString(),
        read: msg.is_read || true,
        message_type: msg.message_type || 'text'
      })) || [];
      
      console.log('✅ Transformed messages:', transformedMessages);
      return transformedMessages;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load messages';
      setError(errorMsg);
      console.error('💥 Error loading messages:', err);
      return [];
    }
  }, [currentUserId]);

  // Send a message in the current chat
  const sendMessage = async (content) => {
    if (!currentChat) {
      throw new Error('No active chat selected');
    }
    
    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      content,
      sender: 'me',
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await chatService.sendMessage(currentChat.conversation_id || currentChat._id, content);
      
      const newMessage = {
        _id: response.message_id || response.id,
        message_id: response.message_id,
        content: content,
        sender: 'me',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? newMessage : msg
        )
      );
      
      // Reload messages to get the latest
      const updatedMessages = await loadMessages(currentChat.conversation_id || currentChat._id);
      setMessages(updatedMessages);
      
      // Refresh chats list
      loadChats();
      
      return newMessage;
    } catch (err) {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message';
      setError(errorMsg);
      throw err;
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds) => {
    if (!currentChat || !messageIds.length) return;
    
    try {
      await chatService.markAsRead(currentChat.conversation_id || currentChat._id, messageIds);
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - messageIds.length));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

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
      throw err;
    }
  };

  // Set the current active chat
  const setActiveChat = useCallback(async (chat) => {
    console.log('🎯 Setting active chat:', chat);
    
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