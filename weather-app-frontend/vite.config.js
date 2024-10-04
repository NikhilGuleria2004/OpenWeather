import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Directory where the build files will be output
  },
  server: {
    // Proxy API calls to avoid CORS issues in development
    proxy: {
      '/api': 'https://openweatherappnikhil.vercel.app/'
    }
  }
});