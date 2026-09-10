import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ------------------------------------------------------------------
   "Muito mais que uma conta" — foto + grade de ícones reveladas pelo
   scroll (ver styles/mais-conta.css para o histórico da mudança de
   layout). A foto e cada item da grade fazem um fade + leve subida
   conforme entram na tela, sempre atrelado à posição do scroll
   (scrub), nunca autoplay — reversível ao rolar para cima.
------------------------------------------------------------------ */

export function initMaisConta({ reducedMotion } = {}) {
  const section = document.querySelector('.mais-conta');
  const media = section?.querySelector('.mais-conta__media');
  const items = Array.from(section?.querySelectorAll('.mais-conta__item') ?? []);
  const targets = [media, ...items].filter(Boolean);
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

  if (import.meta.env.DEV) window.__maisConta = { timeline, ScrollTrigger };

  return {
    dispose() {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    },
  };
}
