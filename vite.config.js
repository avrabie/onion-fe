import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const API_BASE = process.env.VITE_API_BASE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: !API_BASE ? {
    proxy: {
      // Proxy API requests to a backend running on localhost:8080 by default
      '/products': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  } : undefined,
})
