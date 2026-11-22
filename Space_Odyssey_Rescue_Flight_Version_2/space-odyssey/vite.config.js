import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.PORT ?? 3001}` } }
  }
});
