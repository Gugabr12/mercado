/* ==================================================================
   HorizontalCardCarousel — componente isolado e reutilizável

   Mecânica (sem scale, sem opacity, sem 3D):
     • a viewport tem overflow: hidden e recorta os cards;
     • o TRACK inteiro é deslocado no eixo X (transform), nunca os
       cards individualmente — os gaps se preservam sozinhos;
     • cada passo = largura real de 1 card + gap real do CSS, medidos
       do DOM (ResizeObserver / resize recalculam);
     • GSAP faz o movimento (power3.inOut, overwrite: true).

   Não depende do resto da aplicação. Sem seletores globais: tudo vem
   por configuração. Classes utilitárias namespaced em .hcc-* ficam no
   CSS irmão (horizontal-card-carousel.css) para uso stand-alone.
================================================================== */

import { gsap } from 'gsap';

const DEFAULTS = {
  duration: 0.65,
  ease: 'power3.inOut',
  gap: null, // null → lê column-gap/gap computado do track
  cardSelector: '.hcc-card',
  swipeThreshold: 40, // px de arrasto horizontal para disparar um passo
  // null → decide sozinho pelo prefers-reduced-motion do SO.
  // true/false → força (o site consumidor manda).
  reduced: null,
};

function resolve(ref, ctx) {
  if (!ref) return null;
  if (typeof ref === 'string') return (ctx || document).querySelector(ref);
  return ref; // já é um Element
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function setDisabled(btn, state) {
  if (!btn) return;
  btn.disabled = state;
  btn.setAttribute('aria-disabled', String(state));
}

export class HorizontalCardCarousel {
  constructor(options = {}) {
    const cfg = { ...DEFAULTS, ...options };

    this.root = resolve(cfg.root);
    if (!this.root) throw new Error('HorizontalCardCarousel: "root" não encontrado');

    this.viewport = resolve(cfg.viewport, this.root) || this.root.querySelector('.hcc-viewport');
    this.track = resolve(cfg.track, this.root) || this.root.querySelector('.hcc-track');
    this.prevBtn = resolve(cfg.prev, this.root) || this.root.querySelector('.hcc-prev');
    this.nextBtn = resolve(cfg.next, this.root) || this.root.querySelector('.hcc-next');

    if (!this.viewport || !this.track) {
      throw new Error('HorizontalCardCarousel: "viewport" e "track" são obrigatórios');
    }

    this.cardSelector = cfg.cardSelector;
    this.duration = cfg.duration;
    this.ease = cfg.ease;
    this.explicitGap = cfg.gap;
    this.swipeThreshold = cfg.swipeThreshold;

    this._reduced =
      cfg.reduced != null
        ? cfg.reduced
        : typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.index = 0;
    this.step = 0;
    this.maxOffset = 0;
    this.maxIndex = 0;

    /* ---- listeners ---- */
    this._onPrev = () => this.prev();
    this._onNext = () => this.next();
    this._onKeydown = (event) => this._handleKey(event);
    this._onWinResize = () => this.refresh();

    this.prevBtn?.addEventListener('click', this._onPrev);
    this.nextBtn?.addEventListener('click', this._onNext);
    this.root.addEventListener('keydown', this._onKeydown);

    this._bindPointer();

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.refresh());
      this._ro.observe(this.viewport);
      this._ro.observe(this.track);
    } else {
      window.addEventListener('resize', this._onWinResize, { passive: true });
    }

    gsap.set(this.track, { x: 0 });
    this.refresh();

    if (import.meta.env?.DEV) {
      (window.__hcc ||= []).push(this);
      window.__hccGsap = gsap;
    }
  }

  /* ---------------- medição ---------------- */

  get cards() {
    return Array.from(this.track.querySelectorAll(this.cardSelector));
  }

  _measure() {
    const first = this.cards[0];
    const cardWidth = first ? first.getBoundingClientRect().width : 0;

    let gap = this.explicitGap;
    if (gap == null) {
      const cs = getComputedStyle(this.track);
      gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    }

    this.step = cardWidth + gap;
    // quanto o track precisa andar para o último card encostar na borda direita
    this.maxOffset = Math.max(0, this.track.scrollWidth - this.viewport.clientWidth);
    this.maxIndex = this.step > 0 ? Math.ceil(this.maxOffset / this.step - 0.001) : 0;
  }

  _targetX(index) {
    // position = -(index * step), travado para o track nunca passar do fim
    return -Math.min(index * this.step, this.maxOffset);
  }

  _syncButtons() {
    setDisabled(this.prevBtn, this.index <= 0);
    setDisabled(this.nextBtn, this.index >= this.maxIndex);
  }

  _go(index, animate = true) {
    this.index = clamp(Math.round(index), 0, this.maxIndex);
    const x = this._targetX(this.index);

    if (animate && !this._reduced) {
      gsap.to(this.track, {
        x,
        duration: this.duration,
        ease: this.ease,
        overwrite: true, // cliques rápidos não acumulam tweens
      });
    } else {
      gsap.killTweensOf(this.track);
      gsap.set(this.track, { x });
    }

    this._syncButtons();
  }

  /* ---------------- API pública ---------------- */

  next() {
    if (this.index < this.maxIndex) this._go(this.index + 1);
  }

  prev() {
    if (this.index > 0) this._go(this.index - 1);
  }

  goTo(index) {
    this._go(index);
  }

  refresh() {
    this._measure();
    // mantém o índice atual (reclampado) e reposiciona sem animar → sem salto
    this._go(Math.min(this.index, this.maxIndex), false);
  }

  destroy() {
    gsap.killTweensOf(this.track);
    this.prevBtn?.removeEventListener('click', this._onPrev);
    this.nextBtn?.removeEventListener('click', this._onNext);
    this.root.removeEventListener('keydown', this._onKeydown);
    window.removeEventListener('resize', this._onWinResize);
    this._ro?.disconnect();
    this._unbindPointer?.();
    gsap.set(this.track, { clearProps: 'transform' });
  }

  /* ---------------- teclado ---------------- */

  _handleKey(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  /* ---------------- swipe (pointer events) ---------------- */

  _bindPointer() {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let axisLocked = false;
    let fired = false;

    const down = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      tracking = true;
      axisLocked = false;
      fired = false;
      startX = event.clientX;
      startY = event.clientY;
    };

    const move = (event) => {
      if (!tracking) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!axisLocked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axisLocked = true;
        // gesto majoritariamente vertical → devolve o scroll para a página
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking = false;
          return;
        }
      }

      event.preventDefault(); // segura o scroll horizontal nativo
      if (!fired && Math.abs(dx) >= this.swipeThreshold) {
        fired = true;
        if (dx < 0) this.next();
        else this.prev();
      }
    };

    const up = () => {
      tracking = false;
    };

    this.viewport.addEventListener('pointerdown', down);
    this.viewport.addEventListener('pointermove', move, { passive: false });
    this.viewport.addEventListener('pointerup', up);
    this.viewport.addEventListener('pointercancel', up);
    this.viewport.addEventListener('pointerleave', up);

    this._unbindPointer = () => {
      this.viewport.removeEventListener('pointerdown', down);
      this.viewport.removeEventListener('pointermove', move);
      this.viewport.removeEventListener('pointerup', up);
      this.viewport.removeEventListener('pointercancel', up);
      this.viewport.removeEventListener('pointerleave', up);
    };
  }
}

/** Helper tolerante a falha — devolve null se o DOM esperado não existir. */
export function initHorizontalCardCarousel(options) {
  try {
    return new HorizontalCardCarousel(options);
  } catch (error) {
    if (import.meta.env?.DEV) console.warn('[HorizontalCardCarousel]', error.message);
    return null;
  }
}

export default HorizontalCardCarousel;
