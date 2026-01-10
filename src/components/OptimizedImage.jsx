import React, { useState, useRef, useEffect, useCallback } from 'react';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/mockvehicle.png',
  lazy = true,
  threshold = 100,
  placeholder = 'blur',
  quality = 75,
  maxWidth = 800,
  maxHeight = 600,
  onLoad,
  onError,
  ...props
}) => {
  const [imageState, setImageState] = useState({
    isLoading: true,
    hasError: false,
    isLoaded: false,
    isIntersecting: !lazy
  });
  
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Optimized URL generator with compression parameters
  const getOptimizedUrl = useCallback((originalSrc) => {
    if (!originalSrc || originalSrc.startsWith('data:')) {
      return originalSrc;
    }

    // If it's already an external URL, return as-is
    if (originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // Construct optimized URL with compression parameters
    const baseUrl = 'https://api.emov.com.pk/image/';
    const cleanPath = originalSrc.replace(/^\/+/, '');
    
    // Add optimization parameters (if your API supports them)
    const params = new URLSearchParams({
      q: quality.toString(),
      w: maxWidth.toString(),
      h: maxHeight.toString(),
      fm: 'webp' // Prefer WebP format
    });

    return `${baseUrl}${cleanPath}?${params.toString()}`;
  }, [quality, maxWidth, maxHeight]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || imageState.isIntersecting) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageState(prev => ({ ...prev, isIntersecting: true }));
          observerRef.current?.disconnect();
        }
      },
      { threshold: threshold / 100, rootMargin: `${threshold}px` }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, threshold, imageState.isIntersecting]);

  // Preload image when it becomes visible
  useEffect(() => {
    if (!imageState.isIntersecting || imageState.isLoaded || imageState.hasError) {
      return;
    }

    const img = new Image();
    const optimizedSrc = getOptimizedUrl(src);

    img.onload = () => {
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        hasError: false
      }));
      onLoad?.();
    };

    img.onerror = () => {
      retryCountRef.current += 1;
      
      if (retryCountRef.current <= maxRetries) {
        // Retry with fallback
        setTimeout(() => {
          img.src = fallbackSrc;
        }, 1000 * retryCountRef.current);
      } else {
        setImageState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
          isLoaded: false
        }));
        onError?.();
      }
    };

    // Start loading
    img.src = optimizedSrc;
  }, [imageState.isIntersecting, imageState.isLoaded, imageState.hasError, src, fallbackSrc, getOptimizedUrl, onLoad, onError]);

  // Placeholder component
  const Placeholder = () => {
    if (placeholder === 'blur') {
      return (
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse ${className}`}
          {...props}
        />
      );
    }
    
    if (placeholder === 'skeleton') {
      return (
        <div 
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}
          {...props}
        />
      );
    }

    return null;
  };

  return (
    <div ref={imgRef} className="relative overflow-hidden">
      {/* Placeholder */}
      {(imageState.isLoading || !imageState.isIntersecting) && <Placeholder />}

      {/* Actual image */}
      {imageState.isIntersecting && (
        <img
          src={imageState.isLoaded ? getOptimizedUrl(src) : undefined}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            imageState.isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            ...props.style
          }}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          {...props}
        />
      )}

      {/* Error fallback */}
      {imageState.hasError && (
        <img
          src={fallbackSrc}
          alt={`${alt} (fallback)`}
          className={className}
          style={{
            objectFit: 'cover',
            ...props.style
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
