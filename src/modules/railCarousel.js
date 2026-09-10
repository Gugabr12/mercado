/**
 * Carrossel por scroll horizontal nativo, com setas.
 *
 * Genérico porque hoje só a dobra "conta negócio" usa esse padrão
 * (a extinta "A conta completa" usava o mesmo código antes de virar
 * mais-conta/index.js — ver LEIA-ME.md).
 */
// ease-in-out cúbica: início e fim suaves, sem o "corte seco" do
// `behavior: 'smooth'` nativo (curto demais e não ajustável).
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function initRailCarousel({ railSelector, cardSelector, trackSelector, arrowSelector }) {
  const rail = document.querySelector(railSelector);
  const track = document.querySelector(trackSelector);
  const arrows = Array.from(document.querySelectorAll(arrowSelector));
  if (!rail || !track || arrows.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const step = () => {
    const card = rail.querySelector(cardSelector);
    if (!card) return rail.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    return card.getBoundingClientRect().width + gap;
  };

  const sync = () => {
    const max = rail.scrollWidth - rail.clientWidth - 1;
    arrows.forEach((arrow) => {
      const forward = Number(arrow.dataset.dir) > 0;
      arrow.disabled = forward ? rail.scrollLeft >= max : rail.scrollLeft <= 1;
    });
  };

  let rafId = 0;

  const smoothScrollBy = (delta, duration = 600) => {
    cancelAnimationFrame(rafId);

    const max = rail.scrollWidth - rail.clientWidth;
    const from = rail.scrollLeft;
    const to = Math.min(Math.max(from + delta, 0), max);
    const distance = to - from;
    const start = performance.now();

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      rail.scrollLeft = from + distance * easeInOutCubic(t);
      if (t < 1) rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
  };

  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
      const delta = Number(arrow.dataset.dir) * step();
      if (reducedMotion) rail.scrollLeft += delta;
      else smoothScrollBy(delta);
    });
  });

  // dispara a cada mudança de scrollLeft, seja pelo rAF acima, seja por
  // scroll manual (touch/trackpad) — mantém as setas sempre sincronizadas
  rail.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  sync();
}
