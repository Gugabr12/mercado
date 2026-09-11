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

  /* ------------------------------------------------------------------
     O pin continua sendo o `position: sticky` do CSS (card-experience.css)
     — não o `pin: true` do ScrollTrigger. O cartão 3D carrega lazy (só
     perto da seção, ver scroll-scenes.js); um pin *dinâmico* insere seu
     spacer só quando o JS termina de carregar, e isso dava um salto no
     layout bem na hora em que o usuário chegava perto. O sticky do CSS
     já existe desde o primeiro paint do HTML, sem esse risco.

     start "top 75%": a timeline já começa a andar com o topo da seção
     ainda a 25% do viewport por rolar — o cartão reage assim que a
     dobra aparece, não só depois de grudar no topo.
     end "+=1000": ~1000px de rolagem cobrem a experiência inteira (era
     a altura inteira da seção, 320vh/360svh — vários "vh" de rolagem
     morta). scrub curto (0.45) mantém a resposta ao mouse/trackpad ágil
     sem ficar trepidante.
  ------------------------------------------------------------------ */
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      end: '+=1000',
      scrub: 0.45,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.progress > 0.93) scene.enableParallax();
      },
    },
  });

  /* ---- Fase 01 · 0–10,6% — o cartão surge quase de perfil ---- */
  timeline
    .to(state, { dy: -0.085, z: -0.6, scale: 0.9, duration: 0.106 }, 0)
    .to(state, { ry: -45 * DEG, rx: -0.045, rz: 0.045, duration: 0.106 }, 0)

    /* ---- Fase 02 · 10,6–21,2% — primeira revelação da frente ---- */
    .to(state, { ry: 0, rx: -0.02, rz: 0.02, duration: 0.106 }, 0.106)
    .to(state, { dy: -0.02, z: 0.45, scale: 1.08, duration: 0.106 }, 0.106)

    /* ---- Fase 03 · 21,2–30,7% — segue girando até quase o perfil ---- */
    .to(state, { ry: 90 * DEG, duration: 0.095 }, 0.212)
    .to(state, { dy: 0, z: 0.1, scale: 1.02, duration: 0.095 }, 0.212)

    /* ---- Fase 04 · 30,7–37,1% — o verso aparece ---- */
    .to(state, { ry: 180 * DEG, rx: 0.01, rz: 0, duration: 0.064 }, 0.307)

    /* ---- 37,1–40% — pequena pausa para ler o verso ---- */
    .to(state, { ry: 180 * DEG, duration: 0.029 }, 0.371)

    /* ---- Fase 05 · 40–45% — 180 → 270 → 360, volta para a frente
           enquanto migra para a posição da composição final. A partir
           daqui (45%) o cartão já está no estado principal. ---- */
    .to(state, { ...FINAL, duration: 0.05 }, 0.4);

  /* ---- Benefícios · com o cartão já assentado, cada pílula entra em
     sequência — 46% a 72% da timeline (janela pedida: 45–75%) ---- */
  const cues = [0.46, 0.55, 0.64, 0.72];
  cues.forEach((at, index) => {
    timeline.to(benefits[index], { opacity: 1, x: 0, y: 0, duration: 0.035, ease: 'power2.out' }, at);
  });

  /* ---- Copy final · entra logo depois do último benefício, e ainda
     sobra folga (até 100%) pro cartão segurar o frame antes de a
     seção liberar o scroll pra próxima dobra ---- */
  timeline
    .to(label, { opacity: 1, duration: 0.04 }, 0.78)
    .to(headline, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.05 }, 0.81)
    .to(state, { float: 1, duration: 0.04 }, 0.9);

  return timeline;
}
