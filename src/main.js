import './styles/base.css';
import './styles/site.css';
import './styles/um-so-lugar.css';
import './styles/card-experience.css';
import './styles/mais-conta.css';
import './styles/footer.css';

import { initNavbar } from './modules/navbar.js';
import { initUmSoLugarHover } from './modules/umSoLugarHover.js';
import { initRailCarousel } from './modules/railCarousel.js';

initNavbar();
initUmSoLugarHover();
initRailCarousel({
  railSelector: '.business__rail',
  cardSelector: '.business-card',
  trackSelector: '.business__track',
  arrowSelector: '.business__arrow',
});

// three + gsap saem do bundle inicial: as dobras dirigidas por scroll são
// carregadas em paralelo, depois que o topo da página já pintou
import('./scroll-scenes.js').then(({ initScrollScenes }) =>
  initScrollScenes(import.meta.env.BASE_URL),
);
