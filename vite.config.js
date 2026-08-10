import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7001,
    strictPort: true,
    host: true,
    allowedHosts: [
      'users.docapp.co.in'
    ]
  }
});