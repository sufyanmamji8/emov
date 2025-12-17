// Optimized Image Cache with memory management and parallel operations
const ImageCache = {
  dbName: 'emov_chat_cache',
  storeName: 'images',
  db: null,
  initPromise: null,
  pendingRequests: new Map(),
  maxCacheSize: 50 * 1024 * 1024, // 50MB limit
  objectUrls: new WeakMap(), // Track created URLs for cleanup

  // Initialize database once and cache the promise
  async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2); // Increment version for cleanup
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
    
    return this.initPromise;
  },

  // Check cache size and clean old entries
  async cleanupCache() {
    try {
      await this.init();
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      // Get all entries ordered by timestamp
      const request = index.openCursor(null, 'prev');
      let totalSize = 0;
      let entries = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const entry = cursor.value;
          const size = entry.blob?.size || 0;
          totalSize += size;
          entries.push({ cursor, size, timestamp: entry.timestamp });
          cursor.continue();
        } else {
          // Remove oldest entries if over limit
          if (totalSize > this.maxCacheSize) {
            let currentSize = totalSize;
            entries.sort((a, b) => a.timestamp - b.timestamp); // Oldest first
            for (const entry of entries) {
              if (currentSize <= this.maxCacheSize * 0.8) break; // Keep at 80% capacity
              entry.cursor.delete();
              currentSize -= entry.size;
            }
          }
        }
      };
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  },

  // Get cached blob with request deduplication
  async get(url) {
    try {
      await this.init();
      
      // Check if request is already pending
      if (this.pendingRequests.has(url)) {
        return this.pendingRequests.get(url);
      }
      
      const promise = new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(url);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.blob) {
            // Update timestamp for LRU
            this.updateTimestamp(url);
            resolve(result.blob);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
      
      this.pendingRequests.set(url, promise);
      try {
        const result = await promise;
        return result;
      } finally {
        this.pendingRequests.delete(url);
      }
    } catch (error) {
      return null;
    }
  },

  // Update timestamp for LRU
  async updateTimestamp(url) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.timestamp = Date.now();
          store.put(data);
        }
      };
    } catch (error) {
      // Silent fail
    }
  },

  // Set cached blob with cleanup
  async set(url, blob) {
    try {
      await this.init();
      await this.cleanupCache(); // Check size limits
      
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

  // Optimized getImageUrl with parallel loading and cleanup
  async getImageUrl(filename) {
    if (!filename) return null;
    
    const url = filename.startsWith('http') ? filename : 
                `https://api.emov.com.pk/image/${filename.replace(/^\/+|\/+$/g, '').replace(/^uploads\//, '')}`;
    
    // Check cache first
    const cachedBlob = await this.get(url);
    if (cachedBlob) {
      const objectUrl = URL.createObjectURL(cachedBlob);
      this.objectUrls.set(objectUrl, cachedBlob);
      return objectUrl;
    }
    
    // Fetch with timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'force-cache' // Use browser cache too
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      
      // Cache the blob in background (non-blocking)
      this.set(url, blob).catch(() => {}); // Silent fail
      
      const objectUrl = URL.createObjectURL(blob);
      this.objectUrls.set(objectUrl, blob);
      return objectUrl;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Image fetch failed:', error.message);
      return url; // Fallback to original URL
    }
  },

  // Revoke object URL to prevent memory leaks
  revokeObjectUrl(objectUrl) {
    if (this.objectUrls.has(objectUrl)) {
      URL.revokeObjectURL(objectUrl);
      this.objectUrls.delete(objectUrl);
    }
  },

  // Clear all cached images
  async clear() {
    try {
      await this.init();
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.clear();
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }
};

// API Response Cache for chat data
const ChatApiCache = {
  CACHE_TTL: 3 * 60 * 1000, // 3 minutes
  cache: new Map(),

  getCacheKey(url, params = {}) {
    const paramString = new URLSearchParams(params).toString();
    return paramString ? `${url}?${paramString}` : url;
  },

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  },

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  clear(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
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
    const userId = user ? (user.id || user.userId || 19) : 19;
    console.log('[AuthManager] getUserId - user:', user, 'final userId:', userId);
    return userId;
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

  // Get all conversations - WITH CACHING
  async getChats(userId) {
    // Clear cache for this user to ensure fresh data
    ChatApiCache.clear(`/get-user-conversations/${userId}`);
    
    const cacheKey = ChatApiCache.getCacheKey(`/get-user-conversations/${userId}`);
    const cachedData = ChatApiCache.get(cacheKey);
    
    if (cachedData) {
      console.log('[ChatService] Using cached data for chats');
      return cachedData;
    }

    const token = AuthManager.getToken();
    if (!token) {
      console.error('[ChatService] No token found');
      throw new Error('Authentication required');
    }

    console.log('[ChatService] Fetching chats for user:', userId);
    console.log('[ChatService] Token available:', !!token);

    // Try multiple endpoints in case one doesn't work
    const endpoints = [
      `https://api.emov.com.pk/v2/get-user-conversations/${userId}`,
      `https://api.emov.com.pk/v2/get-user-conversation/${userId}`, // singular version
      `https://api.emov.com.pk/v1/get-user-conversations/${userId}` // v1 fallback
    ];

    let lastError;
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`[ChatService] Trying endpoint ${i + 1}: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log(`[ChatService] Response status from endpoint ${i + 1}:`, response.status);
        console.log(`[ChatService] Response headers from endpoint ${i + 1}:`, response.headers);

        if (response.ok) {
          const data = await response.json();
          console.log('[ChatService] Chat data received:', data);
          
          ChatApiCache.set(cacheKey, data);
          return data;
        } else {
          if (response.status === 401) {
            console.error('[ChatService] Unauthorized - clearing auth');
            AuthManager.clearAuth();
            window.dispatchEvent(new Event('unauthorized'));
            throw new Error('Authentication failed');
          }
          
          const errorText = await response.text();
          console.error(`[ChatService] Error response from endpoint ${i + 1}:`, errorText);
          lastError = `Failed to fetch chats from endpoint ${i + 1}: ${response.status} - ${errorText}`;
          
          // Try next endpoint
          continue;
        }
      } catch (error) {
        console.error(`[ChatService] Error with endpoint ${i + 1}:`, error);
        lastError = `Network error with endpoint ${i + 1}: ${error.message}`;
        
        // Try next endpoint
        continue;
      }
    }
    
    // Clear cache on error to force refresh next time
    ChatApiCache.clear(cacheKey);
    throw new Error(lastError || 'All endpoints failed to fetch chats');
  },

  // Get messages for a conversation - WITH CACHING
  async getMessages(conversationId) {
    if (!conversationId) throw new Error('Conversation ID required');

    const userId = AuthManager.getUserId();
    const cacheKey = ChatApiCache.getCacheKey('/get-messages', { conversation_id: conversationId, user_id: userId });
    const cachedData = ChatApiCache.get(cacheKey);
    
    if (cachedData) {
      console.log('[ChatService] Using cached data for messages');
      return cachedData;
    }

    const token = AuthManager.getToken();
    if (!token) throw new Error('Authentication required');

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
    if (response.status === 204) {
      const emptyData = [];
      ChatApiCache.set(cacheKey, emptyData);
      return emptyData;
    }

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
    if (!responseText) {
      const emptyData = [];
      ChatApiCache.set(cacheKey, emptyData);
      return emptyData;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      if (response.ok) {
        const emptyData = [];
        ChatApiCache.set(cacheKey, emptyData);
        return emptyData;
      }
      throw new Error('Invalid server response');
    }

    // Extract messages array
    const messages = Array.isArray(data) ? data : 
                    (data.messages || data.data || []);

    // Pre-cache all images in background
    if (messages.length > 0) {
      this._precacheImages(messages);
    }

    ChatApiCache.set(cacheKey, messages);
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
  },

  // Cache management utilities
  cache: {
    clear: ChatApiCache.clear.bind(ChatApiCache),
    clearAll: () => ChatApiCache.clear(),
    getSize: () => ChatApiCache.cache.size,
    getKeys: () => Array.from(ChatApiCache.cache.keys())
  }
};

export default chatService;