import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DEG = Math.PI / 180;

/* Estado final do cartão — tilt levemente irregular de propósito,
   para não parecer um render matematicamente perfeito. */
const FINAL = {
  dy: 0,
  z: 0,
  scale: 1,
  rx: 1.2 * DEG,
  ry: 360 * DEG,
  rz: -1.1 * DEG,
};

/** Frame final imediato — usado com prefers-reduced-motion. */
export function showFinalFrame(scene, elements) {
  Object.assign(scene.state, FINAL, { float: 0 });
  scene.apply();

  gsap.set(elements.benefits, { opacity: 1, x: 0, y: 0 });
  gsap.set([elements.label, elements.headline], { opacity: 1, y: 0, filter: 'blur(0px)' });
}

export function buildTimeline(scene, elements) {
  const { section, benefits, label, headline } = elements;

  benefits.forEach((benefit) => {
    gsap.set(benefit, { opacity: 0, y: 26, x: benefit.dataset.side === 'right' ? 10 : -10 });
  });
  gsap.set(label, { opacity: 0 });
  gsap.set(headline, { opacity: 0, y: 18, filter: 'blur(4px)' });

  const state = scene.state;

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.progress > 0.965) scene.enableParallax();
      },
    },
  });

  /* ---- Fase 01 · 0–20% — o cartão surge quase de perfil ---- */
  timeline
    .to(state, { dy: -0.085, z: -0.6, scale: 0.9, duration: 0.2 }, 0)
    .to(state, { ry: -45 * DEG, rx: -0.045, rz: 0.045, duration: 0.2 }, 0)

    /* ---- Fase 02 · 20–40% — primeira revelação da frente ---- */
    .to(state, { ry: 0, rx: -0.02, rz: 0.02, duration: 0.2 }, 0.2)
    .to(state, { dy: -0.02, z: 0.45, scale: 1.08, duration: 0.2 }, 0.2)

    /* ---- Fase 03 · 40–58% — segue girando até quase o perfil ---- */
    .to(state, { ry: 90 * DEG, duration: 0.18 }, 0.4)
    .to(state, { dy: 0, z: 0.1, scale: 1.02, duration: 0.18 }, 0.4)

    /* ---- Fase 04 · 58–70% — o verso aparece ---- */
    .to(state, { ry: 180 * DEG, rx: 0.01, rz: 0, duration: 0.12 }, 0.58)

    /* ---- 70–75.5% — pequena pausa para ler o verso ---- */
    .to(state, { ry: 180 * DEG, duration: 0.055 }, 0.7)

    /* ---- Fase 05 · 75.5–85% — 180 → 270 → 360, volta para a frente
           enquanto migra para a posição da composição final ---- */
    .to(state, { ...FINAL, duration: 0.095 }, 0.755);

  /* ---- Benefícios · cada texto sobe assim que o cartão completa um giro ----
     0.40 → frente revelada (fim da fase 02)
     0.58 → perfil a 90° (fim da fase 03)
     0.70 → verso revelado (fim da fase 04)
     0.85 → volta à frente, posição final (fim da fase 05) ---- */
  const cues = [0.4, 0.58, 0.7, 0.85];
  cues.forEach((at, index) => {
    timeline.to(benefits[index], { opacity: 1, x: 0, y: 0, duration: 0.035, ease: 'power2.out' }, at);
  });

  /* ---- Copy final · entra logo depois do último giro, tudo junto na tela ---- */
  timeline
    .to(label, { opacity: 1, duration: 0.02 }, 0.89)
    .to(headline, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.03 }, 0.91)
    .to(state, { float: 1, duration: 0.02 }, 0.97);

  return timeline;
}
