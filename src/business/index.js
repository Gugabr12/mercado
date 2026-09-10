import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ------------------------------------------------------------------
   Dobra 5 — "Conta Negócio": reveal por scroll do texto da esquerda
   (eyebrow, título, setas) — fade + leve subida atrelados ao scroll
   (scrub), reversível ao rolar para cima. Nunca autoplay.

   Os CARDS ficam de fora deste reveal de propósito: quem cuida deles é
   o HorizontalCardCarousel (translate no track). Card não recebe
   opacity/scale/stagger — ele só é recortado pela viewport.
------------------------------------------------------------------ */

export function initBusiness({ reducedMotion } = {}) {
  const section = document.querySelector('.business');
  if (!section) return null;

  const targets = [
    section.querySelector('.business__eyebrow'),
    section.querySelector('.business__title'),
    section.querySelector('.business__nav'),
  ].filter(Boolean);
  if (targets.length === 0) return null;

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
