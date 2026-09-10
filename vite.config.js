import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    // evita duas cópias de three (core + addons) no grafo de módulos
    dedupe: ['three'],
  },
  server: {
    port: Number(process.env.PORT) || 5177,
  },
  build: {
    // public/assets já ocupa "assets" no dist — os bundles vão para "bundle"
    assetsDir: 'bundle',
    target: 'es2020',
    cssCodeSplit: false,
    sourcemap: false,
  },
});
