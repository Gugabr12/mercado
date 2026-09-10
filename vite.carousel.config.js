import { defineConfig } from 'vite';

/* Build isolado do componente reutilizável:
     npm run build:carousel
   → dist/horizontal-card-carousel.js   (ESM, minificado)
   → dist/horizontal-card-carousel.css

   `gsap` NÃO entra no bundle — o projeto consumidor fornece.
   Não mexe no dist do site (emptyOutDir: false). */
export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: 'src/modules/horizontal-card-carousel.bundle.js',
      name: 'HorizontalCardCarousel',
      formats: ['es'],
      fileName: () => 'horizontal-card-carousel.js',
    },
    rollupOptions: {
      external: ['gsap'],
      output: {
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css')
            ? 'horizontal-card-carousel.css'
            : 'assets/[name][extname]',
      },
    },
  },
});
