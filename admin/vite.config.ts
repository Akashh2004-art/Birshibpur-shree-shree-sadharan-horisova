import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // ফ্রন্টএন্ড পোর্ট 5173
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // সার্ভার পোর্ট 5000
        changeOrigin: true
      }
    }
  }
});