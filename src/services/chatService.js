// Image cache using IndexedDB for persistent storage
const ImageCache = {
  dbName: 'emov_chat_cache',
  storeName: 'images',
  db: null,

  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' });
        }
      };
    });
  },

  async get(url) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(url);
        
        request.onsuccess = () => resolve(request.result?.blob || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return null;
    }
  },

  async set(url, blob) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({ url, blob, timestamp: Date.now() });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Silent fail for cache errors
    }
  },

  async getImageUrl(filename) {
    if (!filename) return null;
    
    // Handle full URLs
    if (filename.startsWith('http')) {
      const cachedBlob = await this.get(filename);
      if (cachedBlob) return URL.createObjectURL(cachedBlob);
      
      try {
        const response = await fetch(filename);
        if (response.ok) {
          const blob = await response.blob();
          await this.set(filename, blob);
          return URL.createObjectURL(blob);
        }
      } catch (error) {
        // Return original URL on fetch error
      }
      return filename;
    }
    
    // Construct URL from filename
    const cleanFilename = filename.replace(/^\/+|\/+$/g, '').replace(/^uploads\//, '');
    const fullUrl = `https://api.emov.com.pk/image/${cleanFilename}`;
    
    const cachedBlob = await this.get(fullUrl);
    if (cachedBlob) return URL.createObjectURL(cachedBlob);
    
    try {
      const response = await fetch(fullUrl);
      if (response.ok) {
        const blob = await response.blob();
        await this.set(fullUrl, blob);
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      // Return constructed URL on fetch error
    }
    return fullUrl;
  }
};

// Token and user management
const AuthManager = {
  _token: null,
  _user: null,

  getToken() {
    if (!this._token) {
      this._token = localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return this._token;
  },

  getUser() {
    if (!this._user) {
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      this._user = userData ? JSON.parse(userData) : null;
    }
    return this._user;
  },

  getUserId() {
    const user = this.getUser();
    return user ? (user.id || user.userId || 16) : 16;
  },

  clearAuth() {
    this._token = null;
    this._user = null;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  },

  refreshCache() {
    this._token = null;
    this._user = null;
  }
};

const chatService = {
  // Upload image file - Optimized
  async uploadImage(file) {
    const token = AuthManager.getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.emov.com.pk/v2/upload/image', {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract URL with minimal processing
    let imageUrl = data.url || data.original || data.image_url || 
                   data.data?.url || data.data?.original || data.data?.image_url ||
                   data.filename || data;
    
    // Return filename without full URL construction
    if (typeof imageUrl === 'string') {
      if (imageUrl.startsWith('http')) return imageUrl;
      return imageUrl.replace(/^\/+|\/+$/g, '').replace(/^uploads\//, '');
    }
    
    return imageUrl;
  },

  // Upload audio file - Optimized
  async uploadAudio(file) {
    const token = AuthManager.getToken();
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch('https://api.emov.com.pk/v2/upload/audio', {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.original || data.url;
  },

  // Start a new conversation - Optimized
  async startConversation(adId, message, user2Id) {
    const token = AuthManager.getToken();
    if (!token) throw new Error('Authentication required');
    
    const user1Id = AuthManager.getUserId();
    if (!user2Id) throw new Error('Seller user ID required');

    const response = await fetch('https://api.emov.com.pk/v2/start-conversation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user1_id: parseInt(user1Id),
        user2_id: parseInt(user2Id),
        ad_id: parseInt(adId)
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to start conversation: ${response.status}`);
    }

    const data = await response.json();
    
    // Send initial message if provided
    if (message && data.conversation_id) {
      try {
        await this.sendMessage(data.conversation_id, message, user1Id);
      } catch (error) {
        // Conversation created but message failed - non-critical
      }
    }
    
    return data;
  },

  // Send a message - Optimized
  async sendMessage(conversationId, content, senderId = null, messageType = "text") {
    const token = AuthManager.getToken();
    const sid = senderId || AuthManager.getUserId();

    const payload = {
      conversation_id: parseInt(conversationId),
      sender_id: parseInt(sid),
      message_type: messageType,
      message_text: messageType === 'image' || messageType === 'audio' ? '' : content
    };

    if (messageType === 'image' || messageType === 'audio') {
      payload.media_url = content;
    }

    const response = await fetch('https://api.emov.com.pk/v2/send-message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Send failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.message_id,
      conversation_id: parseInt(conversationId),
      sender_id: parseInt(sid),
      message_type: messageType,
      message_text: payload.message_text,
      media_url: payload.media_url || null,
      created_at: new Date().toISOString()
    };
  },

  // Get all conversations - Optimized
  async getChats(userId) {
    const token = AuthManager.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`https://api.emov.com.pk/v2/get-user-conversations/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        AuthManager.clearAuth();
        window.dispatchEvent(new Event('unauthorized'));
      }
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    return await response.json();
  },

  // Get messages for a conversation - Optimized with caching
  async getMessages(conversationId) {
    if (!conversationId) throw new Error('Conversation ID required');

    const token = AuthManager.getToken();
    if (!token) throw new Error('Authentication required');

    const userId = AuthManager.getUserId();

    const response = await fetch('https://api.emov.com.pk/v2/get-messages', {
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

    // Handle 204 No Content
    if (response.status === 204) return [];

    if (!response.ok) {
      if (response.status === 401) {
        AuthManager.clearAuth();
        window.dispatchEvent(new Event('unauthorized'));
        throw new Error('Session expired. Please log in again.');
      }
      if (response.status === 404) {
        throw new Error('Chat not found.');
      }
      throw new Error(`Failed to load messages: ${response.status}`);
    }

    const responseText = await response.text();
    if (!responseText) return [];

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      if (response.ok) return [];
      throw new Error('Invalid server response');
    }

    // Extract messages array
    const messages = Array.isArray(data) ? data : 
                    (data.messages || data.data || []);

    // Pre-cache all images in background
    if (messages.length > 0) {
      this._precacheImages(messages);
    }

    return messages;
  },

  // Pre-cache images in background (non-blocking)
  _precacheImages(messages) {
    setTimeout(() => {
      messages.forEach(msg => {
        if (msg.message_type === 'image' && msg.media_url) {
          ImageCache.getImageUrl(msg.media_url).catch(() => {});
        }
      });
    }, 0);
  },

  // Get cached image URL (use this in your UI)
  async getCachedImageUrl(filename) {
    return await ImageCache.getImageUrl(filename);
  },

  // Delete a conversation - Optimized
  async deleteConversation(conversationId) {
    const token = AuthManager.getToken();
    const response = await fetch('https://api.emov.com.pk/v2/delete-conversation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ conversation_id: conversationId })
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    return await response.json();
  },

  // Delete message - Optimized
  async deleteMessage(messageIds, deleteType = "me") {
    const token = AuthManager.getToken();
    const userId = AuthManager.getUserId();

    const response = await fetch('https://api.emov.com.pk/v2/delete-message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        message_ids: Array.isArray(messageIds) ? messageIds : [messageIds],
        delete_type: deleteType,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    return await response.json();
  }
};

export default chatService;