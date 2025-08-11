import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Africa Universe client. The React
// plugin enables fast refresh and JSX/TSX support. A WebSocket proxy
// is configured so that requests starting with `/ws` are forwarded
// to the backend server running on port 8080.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});