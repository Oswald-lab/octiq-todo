import path from 'path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // node_modules may be a symlink to a shared, read-only tree (the platform's
  // starter deps). Vite must never write into it, and the dev server must be
  // allowed to serve the dependency files that resolve there.
  cacheDir: '.vite',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), '../.starter-deps'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
});
