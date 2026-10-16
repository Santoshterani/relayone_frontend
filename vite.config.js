import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Files that contain JSX use .js in this project (index.js, Widget.js), so tell esbuild to parse JSX in them.
// VITE_BASE_PATH (for example /relayone/) is the URL prefix the pages are served from. Empty = the root.
export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, process.cwd(), '').VITE_BASE_PATH || '/',
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
  server: { port: 5173 }
}));
