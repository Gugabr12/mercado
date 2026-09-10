import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ------------------------------------------------------------------
   Dobra 5 — transição cinematográfica de corte horizontal entre duas
   fotos (business-vendas → business-credito), DIRIGIDA PELO SCROLL.

   O bloco prende (pin) no centro da tela; conforme se rola ~1 tela,
   a Foto 1 sobe e sai pelo topo enquanto a Foto 2 sobe a partir da
   base, as duas na mesma velocidade — a linha divisória varre a tela
   de baixo para cima, sempre reta e horizontal. Rolar para cima
   desfaz a transição (scrub reversível).

   Só translação sincronizada em Y (ver o CSS de .business__reel):
   sem círculo, sem máscara radial/iris, sem zoom, sem rotação, sem
   morph, sem deformar nada. As fotos entram intactas.

   O ease power2.inOut é percorrido ao longo do scroll (com um
   scrub curto pra suavizar), dando o "ease-in / ease-out" pedido.
   Respeita prefers-reduced-motion (trava na Foto 1, sem pin).
------------------------------------------------------------------ */

export function initBusinessReel({ reducedMotion } = {}) {
  const reel = document.querySelector('.business__reel');
  if (!reel) return null;

  const setProgress = (v) => reel.style.setProperty('--reel-progress', String(v));

  if (reducedMotion) {
    setProgress(0);
    return null;
  }

  // anima um objeto simples e reflete em --reel-progress: mais previsível
  // que deixar o GSAP mexer direto na custom property
  const state = { p: 0 };
  const render = () => setProgress(state.p);

  const tween = gsap.to(state, {
    p: 1,
    ease: 'power2.inOut',
    onUpdate: render,
    scrollTrigger: {
      trigger: reel,
      start: 'center center',
      end: '+=100%', // ~1 tela de scroll para a passagem completa
      pin: true,
      pinSpacing: true,
      scrub: 0.5, // suaviza o acompanhamento do scroll
      invalidateOnRefresh: true,
    },
  });

  if (import.meta.env.DEV) window.__businessReel = { tween, state, ScrollTrigger };

  return {
    dispose() {
      tween.scrollTrigger?.kill();
      tween.kill();
      setProgress(0);
    },
  };
}
