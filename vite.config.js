import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true, // listen on all network interfaces
    port: 5173,
    allowedHosts: true // allow tunnels and custom hostnames
  }
});
