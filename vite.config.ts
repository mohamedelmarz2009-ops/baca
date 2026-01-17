import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the app to access process.env.API_KEY in the browser
    // safely replacing it with the value set in Vercel Environment Variables.
    'process.env': process.env
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  }
});