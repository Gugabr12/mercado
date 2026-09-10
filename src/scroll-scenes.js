import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCardExperience } from './card-experience/index.js';
import { initMaisConta } from './mais-conta/index.js';
import { initBusiness } from './business/index.js';
import { initBusinessReel } from './business/reel.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * As dobras dirigidas por scroll. Ficam num chunk separado para que
 * three + gsap não entrem no bundle inicial da página.
 */
export function initScrollScenes(baseUrl) {
  // A experiência roda COMPLETA por padrão — o cartão 3D e os reveals são
  // o conteúdo principal da página. Muitas máquinas Windows vêm com
  // "efeitos de animação" desligado (prefers-reduced-motion: reduce) e aí
  // a página inteira parecia estática. Quem realmente quer a versão calma
  // acessa com ?motion=reduced.
  const reducedMotion =
    new URLSearchParams(window.location.search).get('motion') === 'reduced';

  initCardExperience(baseUrl, { reducedMotion });
  initMaisConta({ reducedMotion });
  initBusiness({ reducedMotion });
  initBusinessReel({ reducedMotion });
}
