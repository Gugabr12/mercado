import { defineConfig } from 'vite';

/* Build isolado do componente reutilizável:
     npm run build:carousel
   → dist/horizontal-card-carousel.js       ESM  (gsap externo — projetos com bundler)
   → dist/horizontal-card-carousel.umd.cjs  UMD  (gsap global window.gsap — drop-in <script>)
   → dist/horizontal-card-carousel.css

   Uso drop-in numa página qualquer:
     <link rel="stylesheet" href="horizontal-card-carousel.css">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
     <script src="horizontal-card-carousel.umd.cjs"></script>
     <script>
       const { HorizontalCardCarousel } = window.HorizontalCardCarousel;
       new HorizontalCardCarousel({ root: '#meu-carrossel' });
     </script>

   Não mexe no dist do site (emptyOutDir: false). */
export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: 'src/modules/horizontal-card-carousel.bundle.js',
      name: 'HorizontalCardCarousel',
      formats: ['es', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'horizontal-card-carousel.js' : 'horizontal-card-carousel.umd.cjs',
    },
    rollupOptions: {
      external: ['gsap'],
      output: {
        exports: 'named',
        globals: { gsap: 'gsap' },
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css')
            ? 'horizontal-card-carousel.css'
            : 'assets/[name][extname]',
      },
    },
  },
});
