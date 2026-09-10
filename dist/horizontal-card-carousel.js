import { gsap as n } from "gsap";
const f = {
  duration: 0.65,
  ease: "power3.inOut",
  gap: null,
  // null → lê column-gap/gap computado do track
  cardSelector: ".hcc-card",
  swipeThreshold: 40,
  // px de arrasto horizontal para disparar um passo
  // null → decide sozinho pelo prefers-reduced-motion do SO.
  // true/false → força (o site consumidor manda).
  reduced: null
};
function a(i, t) {
  return i ? typeof i == "string" ? (t || document).querySelector(i) : i : null;
}
const w = (i, t, e) => Math.max(t, Math.min(e, i));
function v(i, t) {
  i && (i.disabled = t, i.setAttribute("aria-disabled", String(t)));
}
class x {
  constructor(t = {}) {
    const e = { ...f, ...t };
    if (this.root = a(e.root), !this.root) throw new Error('HorizontalCardCarousel: "root" não encontrado');
    if (this.viewport = a(e.viewport, this.root) || this.root.querySelector(".hcc-viewport"), this.track = a(e.track, this.root) || this.root.querySelector(".hcc-track"), this.prevBtn = a(e.prev, this.root) || this.root.querySelector(".hcc-prev"), this.nextBtn = a(e.next, this.root) || this.root.querySelector(".hcc-next"), !this.viewport || !this.track)
      throw new Error('HorizontalCardCarousel: "viewport" e "track" são obrigatórios');
    this.cardSelector = e.cardSelector, this.duration = e.duration, this.ease = e.ease, this.explicitGap = e.gap, this.swipeThreshold = e.swipeThreshold, this._reduced = e.reduced != null ? e.reduced : typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, this.index = 0, this.step = 0, this.maxOffset = 0, this.maxIndex = 0, this._onPrev = () => this.prev(), this._onNext = () => this.next(), this._onKeydown = (r) => this._handleKey(r), this._onWinResize = () => this.refresh(), this.prevBtn?.addEventListener("click", this._onPrev), this.nextBtn?.addEventListener("click", this._onNext), this.root.addEventListener("keydown", this._onKeydown), this._bindPointer(), typeof ResizeObserver < "u" ? (this._ro = new ResizeObserver(() => this.refresh()), this._ro.observe(this.viewport), this._ro.observe(this.track)) : window.addEventListener("resize", this._onWinResize, { passive: !0 }), n.set(this.track, { x: 0 }), this.refresh(), (window.__hcc ||= []).push(this), window.__hccGsap ||= n;
  }
  /* ---------------- medição ---------------- */
  get cards() {
    return Array.from(this.track.querySelectorAll(this.cardSelector));
  }
  _measure() {
    const t = this.cards[0], e = t ? t.getBoundingClientRect().width : 0;
    let r = this.explicitGap;
    if (r == null) {
      const o = getComputedStyle(this.track);
      r = parseFloat(o.columnGap || o.gap || "0") || 0;
    }
    this.step = e + r, this.maxOffset = Math.max(0, this.track.scrollWidth - this.viewport.clientWidth), this.maxIndex = this.step > 0 ? Math.ceil(this.maxOffset / this.step - 1e-3) : 0;
  }
  _targetX(t) {
    return -Math.min(t * this.step, this.maxOffset);
  }
  _syncButtons() {
    v(this.prevBtn, this.index <= 0), v(this.nextBtn, this.index >= this.maxIndex);
  }
  _go(t, e = !0) {
    this.index = w(Math.round(t), 0, this.maxIndex);
    const r = this._targetX(this.index);
    e && !this._reduced ? n.to(this.track, {
      x: r,
      duration: this.duration,
      ease: this.ease,
      overwrite: !0
      // cliques rápidos não acumulam tweens
    }) : (n.killTweensOf(this.track), n.set(this.track, { x: r })), this._syncButtons();
  }
  /* ---------------- API pública ---------------- */
  next() {
    this.index < this.maxIndex && this._go(this.index + 1);
  }
  prev() {
    this.index > 0 && this._go(this.index - 1);
  }
  goTo(t) {
    this._go(t);
  }
  refresh() {
    this._measure(), this._go(Math.min(this.index, this.maxIndex), !1);
  }
  destroy() {
    n.killTweensOf(this.track), this.prevBtn?.removeEventListener("click", this._onPrev), this.nextBtn?.removeEventListener("click", this._onNext), this.root.removeEventListener("keydown", this._onKeydown), window.removeEventListener("resize", this._onWinResize), this._ro?.disconnect(), this._unbindPointer?.(), n.set(this.track, { clearProps: "transform" });
  }
  /* ---------------- teclado ---------------- */
  _handleKey(t) {
    t.key === "ArrowRight" ? (t.preventDefault(), this.next()) : t.key === "ArrowLeft" && (t.preventDefault(), this.prev());
  }
  /* ---------------- swipe (pointer events) ---------------- */
  _bindPointer() {
    let t = 0, e = 0, r = !1, o = !1, d = !1;
    const l = (s) => {
      s.pointerType === "mouse" && s.button !== 0 || (r = !0, o = !1, d = !1, t = s.clientX, e = s.clientY);
    }, p = (s) => {
      if (!r) return;
      const c = s.clientX - t, u = s.clientY - e;
      if (!o) {
        if (Math.abs(c) < 8 && Math.abs(u) < 8) return;
        if (o = !0, Math.abs(u) > Math.abs(c)) {
          r = !1;
          return;
        }
      }
      s.preventDefault(), !d && Math.abs(c) >= this.swipeThreshold && (d = !0, c < 0 ? this.next() : this.prev());
    }, h = () => {
      r = !1;
    };
    this.viewport.addEventListener("pointerdown", l), this.viewport.addEventListener("pointermove", p, { passive: !1 }), this.viewport.addEventListener("pointerup", h), this.viewport.addEventListener("pointercancel", h), this.viewport.addEventListener("pointerleave", h), this._unbindPointer = () => {
      this.viewport.removeEventListener("pointerdown", l), this.viewport.removeEventListener("pointermove", p), this.viewport.removeEventListener("pointerup", h), this.viewport.removeEventListener("pointercancel", h), this.viewport.removeEventListener("pointerleave", h);
    };
  }
}
function _(i) {
  try {
    return new x(i);
  } catch {
    return null;
  }
}
export {
  x as HorizontalCardCarousel,
  _ as initHorizontalCardCarousel
};
