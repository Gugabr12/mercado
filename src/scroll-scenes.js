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
  // ?motion=full ignora o prefers-reduced-motion do sistema. Vale também
  // no build: em máquinas com "efeitos de animação" desligados no SO é a
  // única forma de apresentar a experiência completa.
  const forceMotion = new URLSearchParams(window.location.search).get('motion') === 'full';
  const reducedMotion =
    !forceMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initCardExperience(baseUrl, { reducedMotion });
  initMaisConta({ reducedMotion });
  initBusiness({ reducedMotion });
  initBusinessReel({ reducedMotion });
}
