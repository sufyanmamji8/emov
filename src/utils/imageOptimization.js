// Image optimization utilities for better performance

// Cache for storing optimized image URLs
const imageCache = new Map();
const loadingPromises = new Map();

// Preload critical images
export const preloadImage = (src, options = {}) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }

    if (loadingPromises.has(src)) {
      loadingPromises.get(src).then(resolve).catch(reject);
      return;
    }

    const img = new Image();
    const loadPromise = new Promise((res, rej) => {
      img.onload = () => {
        imageCache.set(src, img);
        loadingPromises.delete(src);
        res(img);
      };
      img.onerror = () => {
        loadingPromises.delete(src);
        rej(new Error(`Failed to load image: ${src}`));
      };
    });

    loadingPromises.set(src, loadPromise);
    
    // Apply optimization parameters
    const optimizedSrc = getOptimizedUrl(src, options);
    img.src = optimizedSrc;
  });
};

// Generate optimized URL with parameters
export const getOptimizedUrl = (src, options = {}) => {
  if (!src || src.startsWith('data:')) {
    return src;
  }

  const {
    quality = 75,
    width = 800,
    height = 600,
    format = 'auto'
  } = options;

  // If it's already an external URL, add optimization parameters
  if (src.startsWith('http')) {
    const url = new URL(src);
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    if (format !== 'auto') {
      url.searchParams.set('fm', format);
    }
    return url.toString();
  }

  // For local images, construct optimized URL
  const baseUrl = 'https://api.emov.com.pk/image/';
  const cleanPath = src.replace(/^\/+/, '');
  
  const params = new URLSearchParams({
    q: quality.toString(),
    w: width.toString(),
    h: height.toString(),
    fm: format === 'auto' ? 'webp' : format
  });

  return `${baseUrl}${cleanPath}?${params.toString()}`;
};

// Clear image cache
export const clearImageCache = () => {
  imageCache.clear();
  loadingPromises.clear();
};

// Get cache statistics
export const getCacheStats = () => {
  return {
    cached: imageCache.size,
    loading: loadingPromises.size
  };
};
