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

     start "top 55%": meio-termo entre a versão que só reagia com a
     seção 100% grudada no topo (lenta demais) e "top 75%" (reagia
     cedo demais, com a seção ainda entrando). Com 55% a seção já está
     bem estabelecida na tela antes de qualquer coisa se mexer.
     end "+=1000": ~1000px de rolagem cobrem a experiência inteira (era
     a altura inteira da seção, 320vh/360svh — vários "vh" de rolagem
     morta). scrub curto (0.45) mantém a resposta ao mouse/trackpad ágil
     sem ficar trepidante.
  ------------------------------------------------------------------ */
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top 55%',
      end: '+=1000',
      scrub: 0.45,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.progress > 0.94) scene.enableParallax();
      },
    },
  });

  /* ---- Respiro · 0–12% — a seção já apareceu, mas o cartão ainda não
     reage; é só esse intervalo sem tween (não um delay em segundos,
     é uma fatia real da timeline) que dá o "chegou numa seção nova"
     antes do cartão começar a se mexer. ---- */

  /* ---- Fase 01 · 12–22,6% — o cartão surge quase de perfil ---- */
  timeline
    .to(state, { dy: -0.085, z: -0.6, scale: 0.9, duration: 0.106 }, 0.12)
    .to(state, { ry: -45 * DEG, rx: -0.045, rz: 0.045, duration: 0.106 }, 0.12)

    /* ---- Fase 02 · 22,6–33,2% — primeira revelação da frente ---- */
    .to(state, { ry: 0, rx: -0.02, rz: 0.02, duration: 0.106 }, 0.226)
    .to(state, { dy: -0.02, z: 0.45, scale: 1.08, duration: 0.106 }, 0.226)

    /* ---- Fase 03 · 33,2–42,7% — segue girando até quase o perfil ---- */
    .to(state, { ry: 90 * DEG, duration: 0.095 }, 0.332)
    .to(state, { dy: 0, z: 0.1, scale: 1.02, duration: 0.095 }, 0.332)

    /* ---- Fase 04 · 42,7–49,1% — o verso aparece ---- */
    .to(state, { ry: 180 * DEG, rx: 0.01, rz: 0, duration: 0.064 }, 0.427)

    /* ---- 49,1–52% — pequena pausa para ler o verso ---- */
    .to(state, { ry: 180 * DEG, duration: 0.029 }, 0.491)

    /* ---- Fase 05 · 52–57% — 180 → 270 → 360, volta para a frente
           enquanto migra para a posição da composição final. A partir
           daqui (~57%) o cartão já está no estado, escala e rotação
           principais. ---- */
    .to(state, { ...FINAL, duration: 0.05 }, 0.52);

  /* ---- Benefícios · com o cartão já assentado, cada pílula entra em
     sequência — 60% a 84,5% da timeline. Duração um pouco mais longa
     que antes (0,035 -> 0,05) porque a pílula agora é uma caixa maior
     e fixa (338px, ver card-experience.css) — um pop rápido demais
     ficava seco nesse tamanho; alongar deixa a entrada mais suave. */
  const cues = [0.6, 0.665, 0.73, 0.795];
  cues.forEach((at, index) => {
    timeline.to(benefits[index], { opacity: 1, x: 0, y: 0, duration: 0.05, ease: 'power2.out' }, at);
  });

  /* ---- Copy final · entra logo depois do último benefício, e ainda
     sobra folga (até 100%) pro cartão segurar o frame antes de a
     seção liberar o scroll pra próxima dobra ---- */
  timeline
    .to(label, { opacity: 1, duration: 0.04 }, 0.81)
    .to(headline, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.05 }, 0.83)
    .to(state, { float: 1, duration: 0.04 }, 0.89);

  return timeline;
}
