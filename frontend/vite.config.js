import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 6002,
    proxy: {
      '/api': 'http://backend:6001'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 6002
  }
})
