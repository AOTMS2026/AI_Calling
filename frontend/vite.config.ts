import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Suppress warnings for chunks up to 1MB (standard for production webapps)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Segment Lucide icons
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            // Segment React DOM
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            // Segment React Router
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'react-router';
            }
            // Segment authentication modules
            if (id.includes('better-auth') || id.includes('auth')) {
              return 'auth-vendor';
            }
            // Segment framework components
            if (id.includes('react')) {
              return 'react-core';
            }
            // Other vendor packages
            return 'vendor';
          }
        }
      }
    }
  }
})
