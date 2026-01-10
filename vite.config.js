import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host:true,
    port: 4000,
    cors: true, // Enable CORS for Vite dev server
    proxy: {
      // Handle all requests to /v2/*
      '^/v2': {
        target: 'https://api.emov.com.pk',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/v2/, '/v2'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the authorization header if it exists
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Add CORS headers to the response
            proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:4000';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Authorization';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            
            // Ensure CORS headers are set in the response
            proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:4000';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            // Ensure content type is set for JSON responses
            if (!proxyRes.headers['content-type'] && proxyRes.headers['content-type'] !== 'application/json') {
              proxyRes.headers['content-type'] = 'application/json';
            }
          });
        }
      },
      // Handle any other API requests that might use /api prefix
      '^/api': {
        target: 'https://api.emov.com.pk/v2',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    cors: {
      origin: 'http://localhost:4000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    },
    hmr: {
      host: 'localhost',
      port: 4000
    },
    // Enable detailed logging
    watch: {
      usePolling: false, // Disable polling for better performance
      interval: 1000 // If needed, use 1 second instead of 100ms
    }
  },
});
