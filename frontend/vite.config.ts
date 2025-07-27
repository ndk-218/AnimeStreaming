import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 5173,
    host: true, // Allow external connections
    cors: true,
    
    // Proxy API calls to backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket proxy for Socket.IO
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    
    // Optimize chunks for video streaming
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunk for stable caching
          vendor: ['react', 'react-dom'],
          
          // HLS player chunk
          player: ['hls.js'],
          
          // API communication chunk  
          api: ['axios', 'socket.io-client']
        }
      }
    },
    
    // Asset handling
    assetsDir: 'assets',
    
    // Increase chunk size warning limit for video assets
    chunkSizeWarningLimit: 1000
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'hls.js', 
      'axios', 
      'socket.io-client'
    ]
  },

  // Path resolution
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@types': '/src/types',
      '@assets': '/src/assets'
    }
  },

  // Preview configuration (for production preview)
  preview: {
    port: 4173,
    host: true
  },

  // Environment variables prefix
  envPrefix: 'VITE_',

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    
    // CSS modules configuration for component-scoped styles
    modules: {
      localsConvention: 'camelCase'
    }
  }
})