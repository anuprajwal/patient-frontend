import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7001,
    strictPort: true,
    host: true,
    allowedHosts: ['users.docapp.co.in'],
    hmr: {
      host: 'users.docapp.co.in',
      protocol: 'wss',
      clientPort: 443,
    },
  }
});