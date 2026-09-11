import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

  initMaisConta({ reducedMotion });
  initBusiness({ reducedMotion });
  initBusinessReel({ reducedMotion });
  initCardExperienceLazily(baseUrl, { reducedMotion });
}

/**
 * O cartão 3D (three.js + PMREM + WebGLRenderer) é de longe a parte mais
 * pesada do bundle — sozinho custa mais main-thread do que todo o resto
 * da página somada. Ele fica numa dobra abaixo da hero + "tudo em um só
 * lugar", então não há motivo pra pagar esse custo (e o TBT que ele gera)
 * antes do usuário chegar perto dela: só entra quando a seção está a
 * ~150px de aparecer na tela.
 */
function initCardExperienceLazily(baseUrl, options) {
  const section = document.querySelector('.card-experience');
  if (!section) return;

  const load = () => import('./card-experience/index.js').then(({ initCardExperience }) =>
    initCardExperience(baseUrl, options),
  );

  if (typeof IntersectionObserver !== 'function') {
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    },
    { rootMargin: '150px 0px' },
  );
  observer.observe(section);
}
