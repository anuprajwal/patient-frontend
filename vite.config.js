import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7001,
    strictPort: true,
    host: true,
    allowedHosts: ['.docapp.co.in', 'users.docapp.co.in'], // Allows Vite to accept requests from your domain
    hmr: {
      host: 'users.docapp.co.in', // Directs the browser HMR websocket to your domain
      protocol: 'wss', // Uses secure websockets if your site is served over HTTPS
      clientPort: 443, // Standard HTTPS port used by Nginx/reverse proxy
    },
  }
});