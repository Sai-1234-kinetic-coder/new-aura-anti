import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['canvas-confetti']
  },
  server: {
    port: 3000,
    open: true
  }
});
