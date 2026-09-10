/* Entrada para o build stand-alone (npm run build:carousel).
   Junta o CSS estrutural ao módulo e reexporta a API pública.
   Gera dist/horizontal-card-carousel.js + dist/horizontal-card-carousel.css.
   `gsap` fica como dependência externa (peer). */
import '../styles/horizontal-card-carousel.css';

export { HorizontalCardCarousel, initHorizontalCardCarousel } from './horizontal-card-carousel.js';
