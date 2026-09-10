import './styles/base.css';
import './styles/site.css';
import './styles/um-so-lugar.css';
import './styles/card-experience.css';
import './styles/mais-conta.css';
import './styles/footer.css';
import './styles/horizontal-card-carousel.css';

import { initNavbar } from './modules/navbar.js';
import { initUmSoLugarHover } from './modules/umSoLugarHover.js';

initNavbar();
initUmSoLugarHover();

// Carrossel "Conta Negócio" — componente isolado (puxa gsap, então sai do
// bundle inicial junto com o chunk de scroll). Só liga nos elementos que já
// existem no HTML; o design continua sendo o do site.
import('./modules/horizontal-card-carousel.js').then(({ initHorizontalCardCarousel }) =>
  initHorizontalCardCarousel({
    root: '.business',
    viewport: '.business__rail',
    track: '.business__track',
    prev: '.business__arrow[data-dir="-1"]',
    next: '.business__arrow[data-dir="1"]',
    cardSelector: '.business-card',
    // alinhado ao scroll-scenes.js: anima por padrão; ?motion=reduced desliga
    reduced: new URLSearchParams(window.location.search).get('motion') === 'reduced',
  }),
);

// three + gsap saem do bundle inicial: as dobras dirigidas por scroll são
// carregadas em paralelo, depois que o topo da página já pintou
import('./scroll-scenes.js').then(({ initScrollScenes }) =>
  initScrollScenes(import.meta.env.BASE_URL),
);
