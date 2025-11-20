const chatService = {
  // Start a new conversation with the ad owner
  async startConversation(adId, message, user2Id) {
    try {
      console.log('🔍 Starting conversation with ad:', adId, 'user2Id:', user2Id);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get current user ID from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found. Please login again.');
      }

      const currentUser = JSON.parse(userData);
      const user1Id = currentUser.id || currentUser.userId || '16';

      if (!user2Id) {
        throw new Error('Seller user ID (user2_id) is required');
      }

      const payload = {
        user1_id: parseInt(user1Id),
        user2_id: parseInt(user2Id),
        ad_id: parseInt(adId)
      };

      console.log('📤 Sending start-conversation payload:', payload);

      const response = await fetch('https://api.emov.com.pk/v2/start-conversation', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Start-conversation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Conversation started successfully:', data);
      
      // After creating conversation, send the initial message
      if (message && data.conversation_id) {
        console.log('💬 Sending initial message...');
        try {
          await this.sendMessage(data.conversation_id, message, user1Id);
          console.log('✅ Initial message sent successfully');
        } catch (messageError) {
          console.warn('⚠️ Could not send initial message, but conversation was created:', messageError);
        }
      }
      
      return data;

    } catch (error) {
      console.error('💥 Error starting conversation:', error);
      throw error;
    }
  },

  // Send a message in a conversation
  async sendMessage(conversationId, content, senderId = null) {
    try {
      console.log('💬 Sending message to conversation:', conversationId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Get sender ID if not provided
      if (!senderId) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const currentUser = JSON.parse(userData);
          senderId = currentUser.id || currentUser.userId || '16';
        }
      }

      const payload = {
        conversation_id: parseInt(conversationId),
        sender_id: parseInt(senderId),
        message_type: "text",
        message_text: content
      };

      console.log('📤 Sending message with payload:', payload);

      const response = await fetch('https://api.emov.com.pk/v2/send-message', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Send message response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Message sent successfully:', data);
      return data;

    } catch (error) {
      console.error('💥 Error sending message:', error);
      throw error;
    }
  },

  // Get all conversations for the current user
  async getChats(userId) {
    try {
      console.log('📞 Fetching conversations for user:', userId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`https://api.emov.com.pk/v2/get-user-conversations/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('📥 Conversations response status:', response.status);
      
      if (!response.ok) {
        // If 404, return empty array instead of throwing
        if (response.status === 404) {
          console.log('📭 No conversations found for user');
          return [];
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Conversations API response:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.conversations)) {
        return data.conversations;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.log('⚠️ Unexpected response format, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('💥 Error fetching conversations:', error);
      // Return empty array instead of throwing to prevent UI blocking
      return [];
    }
  },

  // Get messages for a specific conversation
  async getMessages(conversationId) {
    try {
      console.log('📩 Fetching messages for conversation:', conversationId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`https://api.emov.com.pk/v2/get-messages/${conversationId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('📥 Messages response status:', response.status);
      
      if (!response.ok) {
        // If 404, return empty messages instead of throwing error
        if (response.status === 404) {
          console.log('📭 No messages found for this conversation');
          return { messages: [] };
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Messages response:', data);
      
      // Ensure we always return an object with messages array
      return {
        messages: data.messages || data.data || []
      };
    } catch (error) {
      console.error('💥 Error fetching messages:', error);
      // Return empty messages instead of throwing to prevent UI blocking
      return { messages: [] };
    }
  },

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('https://api.emov.com.pk/v2/delete-message', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          message_id: messageId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('https://api.emov.com.pk/v2/delete-conversation', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          conversation_id: conversationId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  // Mark messages as read
  async markAsRead(conversationId, messageIds) {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('https://api.emov.com.pk/v2/mark-messages-read', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_ids: messageIds
        })
      });
      
      if (!response.ok) {
        console.warn('Mark as read endpoint might not be implemented');
        return;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
};

export default chatService;