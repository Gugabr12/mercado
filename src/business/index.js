import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ------------------------------------------------------------------
   Dobra 5 — "Conta Negócio": o mesmo reveal por scroll de "Muito
   mais que uma conta" (ver src/mais-conta/index.js). O título e cada
   card do carrossel fazem um fade + leve subida conforme entram na
   tela, sempre atrelado à posição do scroll (scrub), nunca autoplay
   — reversível ao rolar para cima.

   Só mexe em opacity/transform: não conflita com o scroll horizontal
   nativo do carrossel (modules/railCarousel.js).
------------------------------------------------------------------ */

export function initBusiness({ reducedMotion } = {}) {
  const section = document.querySelector('.business');
  const heading = section?.querySelector('.business__title');
  const cards = Array.from(section?.querySelectorAll('.business-card') ?? []);
  const targets = [heading, ...cards].filter(Boolean);
  if (!section || targets.length === 0) return null;

  if (reducedMotion) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return null;
  }

  gsap.set(targets, { opacity: 0, y: 24 });

  const timeline = gsap.to(targets, {
    opacity: 1,
    y: 0,
    ease: 'none',
    stagger: 0.06,
    scrollTrigger: {
      trigger: section,
      start: 'top 82%',
      end: 'top 45%',
      scrub: 0.5,
    },
  });

  if (import.meta.env.DEV) window.__business = { timeline, ScrollTrigger };

  return {
    dispose() {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    },
  };
}
