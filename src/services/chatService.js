const chatService = {
  // Upload image file - FIXED: Return the full response with better URL handling
  async uploadImage(file) {
    try {
      console.log('📤 Uploading image file:', file.name, file.type, file.size);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('https://api.emov.com.pk/v2/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      console.log('📥 Image upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Image upload successful - full response:', data);
      
      // First, try to get the URL from the response
      let imageUrl = data.url || data.original || data.image_url || '';
      
      if (!imageUrl && data.data) {
        // If we have a data object, try to extract URL from it
        imageUrl = data.data.url || data.data.original || data.data.image_url || '';
      }
      
      // If we still don't have a URL, try to construct it from the filename
      if (!imageUrl && data.filename) {
        imageUrl = data.filename;
      }
      
      // If we have a URL, format it properly
      if (imageUrl) {
        // If it's already a full URL, return it as is
        if (imageUrl.startsWith('http')) {
          console.log('🌐 Using full image URL:', imageUrl);
          return imageUrl;
        }
        
        // Remove any leading/trailing slashes and any 'uploads/' prefix
        let filename = imageUrl.replace(/^\/+|\/+$/g, '');
        filename = filename.replace(/^uploads\//, '');
        
        // Return just the filename, not the full URL
        console.log('🖼️ Image filename:', filename);
        return filename;
      }
      
      // If we still don't have a URL, try to use the first available string in the response
      if (!imageUrl && typeof data === 'string') {
        console.log('ℹ️ Using string response as image URL:', data);
        return data.startsWith('http') ? data : `https://api.emov.com.pk/image/${data}`;
      }
      
      // As a last resort, return the raw data
      console.warn('⚠️ Could not determine image URL from response, returning raw data');
      return data;

    } catch (error) {
      console.error('💥 Error uploading image:', error);
      throw error;
    }
  },

  // Upload audio file
  async uploadAudio(file) {
    try {
      console.log('📤 Uploading audio file:', file.name, file.type, file.size);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('https://api.emov.com.pk/v2/upload/audio', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      console.log('📥 Audio upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Audio upload successful:', data);
      
      // Return the URL for sending in messages
      return data.original || data.url;

    } catch (error) {
      console.error('💥 Error uploading audio:', error);
      throw error;
    }
  },

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
  async sendMessage(conversationId, content, senderId = null, messageType = "text") {
    try {
      console.log('💬 Sending message to conversation:', conversationId, 'Type:', messageType, 'Content:', content);
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
        message_type: messageType,
        message_text: content
      };

      // For media messages, include the URL in media_url
      if (messageType === 'image' || messageType === 'audio') {
        payload.media_url = content; // The uploaded URL
        payload.message_text = ''; // Clear message_text for media messages
        console.log(`📤 Sending ${messageType} message with media URL:`, content);
      }

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
      // The API now returns just the message_id, so we'll format it to match the expected format
      const result = {
        id: data.message_id,
        conversation_id: parseInt(conversationId),
        sender_id: parseInt(senderId),
        message_type: messageType,
        message_text: messageType === 'image' || messageType === 'audio' ? '' : content,
        media_url: messageType === 'image' || messageType === 'audio' ? content : null,
        created_at: new Date().toISOString()
      };
      console.log('✅ Message sent successfully:', result);
      return result;

    } catch (error) {
      console.error('💥 Error sending message:', error);
      throw error;
    }
  },

  // Get all conversations for the current user - FIXED ENDPOINT
  async getChats(userId) {
    try {
      console.log('🔍 Fetching chats for user:', userId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        throw new Error('Authentication required. Please log in again.');
      }

      // Use the correct endpoint
      const url = `https://api.emov.com.pk/v2/get-user-conversations/${userId}`;
      
      console.log('🌐 API Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.dispatchEvent(new Event('unauthorized'));
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch chats'}`);
      }

      const data = await response.json();
      console.log('✅ Chats data received:', data);
      return data;
      
    } catch (error) {
      console.error('💥 Error in getChats:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId) {
    let response;
    
    try {
      // Validate conversationId
      if (!conversationId) {
        console.error('❌ No conversation ID provided');
        throw new Error('Conversation ID is required');
      }

      console.log('📩 Fetching messages for conversation:', conversationId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        throw new Error('Authentication required');
      }

      // Get current user ID
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      const currentUser = JSON.parse(userData);
      const userId = currentUser.id || currentUser.userId;

      // New POST request with payload
      response = await fetch('https://api.emov.com.pk/v2/get-messages', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: parseInt(conversationId),
          user_id: parseInt(userId)
        })
      });
      
      console.log('📥 Messages response status:', response.status);
      
      // Handle 204 No Content
      if (response.status === 204) {
        console.log('📭 No messages found (204)');
        return [];
      }
      
      // Handle response body
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          error: parseError.message
        });
        
        if (response.status === 500) {
          throw new Error('Server returned an invalid response. Please try again later.');
        }
        
        // If we can't parse the response but got a 200, return empty array
        if (response.ok) {
          console.warn('⚠️ Invalid JSON but status 200, returning empty array');
          return [];
        }
        
        throw new Error(`Invalid server response (${response.status}): ${response.statusText}`);
      }
      
      if (!response.ok) {
        console.error('❌ Server error response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        // Handle common error cases
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.dispatchEvent(new Event('unauthorized'));
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status === 404) {
          throw new Error('Chat not found. It may have been deleted.');
        }
        
        if (response.status === 500) {
          throw new Error('Server error occurred while loading messages. Please try again later.');
        }
        
        throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ Messages response:', responseData);
      
      // Handle different response formats
      if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData && Array.isArray(responseData.messages)) {
        return responseData.messages;
      } else if (responseData && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      console.warn('⚠️ Unexpected response format, returning empty array');
      return [];
      
    } catch (error) {
      console.error('💥 Error in getMessages:', {
        error: error.message,
        conversationId,
        status: response?.status,
        statusText: response?.statusText,
        stack: error.stack
      });
      
      // Convert network errors to more user-friendly messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      
      // Re-throw the error to be handled by the caller
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

  // Delete message for current user or everyone
  async deleteMessage(messageIds, deleteType = "me") {
    try {
      console.log('🗑️ Deleting messages:', { messageIds, deleteType });
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      
      const payload = {
        message_ids: Array.isArray(messageIds) ? messageIds : [messageIds],
        delete_type: deleteType,
        user_id: userData.id || userData.userId || 16 // Fallback to 16 if not found
      };
      
      console.log('📤 Delete message payload:', payload);

      const response = await fetch('https://api.emov.com.pk/v2/delete-message', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Delete message response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Message deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Error deleting message:', error);
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