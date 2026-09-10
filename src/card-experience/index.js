import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CardScene } from './CardScene.js';
import { buildTimeline, showFinalFrame } from './timeline.js';

/**
 * Dobra 3 — cena pinada, cartão 3D real dirigido exclusivamente pelo scroll.
 * O canvas fica com pointer-events: none; nada aqui bloqueia o scroll nativo.
 */
export async function initCardExperience(baseUrl, { reducedMotion }) {
  const section = document.querySelector('.card-experience');
  const stage = section?.querySelector('.sticky-scene');
  const canvas = stage?.querySelector('.scene__canvas');
  if (!section || !stage || !canvas) return null;

  const elements = {
    section,
    stage,
    benefits: Array.from(stage.querySelectorAll('.benefit')),
    label: stage.querySelector('.final-copy__label'),
    headline: stage.querySelector('.final-copy__headline'),
  };

  const scene = new CardScene(canvas, stage);

  try {
    await scene.init(baseUrl);
  } catch (error) {
    // sem WebGL / textura indisponível: a seção continua legível, só sem 3D
    console.error('Cena 3D indisponível:', error);
    stage.classList.add('is-fallback');
    showFinalFrame({ state: {}, apply() {} }, elements);
    return null;
  }

  if (reducedMotion) {
    showFinalFrame(scene, elements);
  } else {
    const timeline = buildTimeline(scene, elements);
    if (import.meta.env.DEV) window.__cardTimeline = timeline;
  }

  // não depende de requestAnimationFrame: se a aba estiver oculta na
  // inicialização, o rAF não dispara e o canvas ficaria invisível
  stage.classList.add('is-ready');
  ScrollTrigger.refresh();

  if (import.meta.env.DEV) window.__cardScene = scene;

  window.addEventListener('pagehide', () => scene.dispose(), { once: true });
  return scene;
}
