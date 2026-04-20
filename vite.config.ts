import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  server: {
    open: false,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'ai-dino.js',
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {},
    },
  },
});
