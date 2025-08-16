import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

const API_BASE = process.env.VITE_API_BASE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    },
  } : undefined,
})
