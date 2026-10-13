import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Files that contain JSX use .js in this project (index.js, Widget.js), so tell esbuild to parse JSX in them.
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
  server: { port: 5173 }
});
