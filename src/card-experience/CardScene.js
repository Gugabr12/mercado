import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CARD_HEIGHT, createCard, loadCardTextures } from './Card3D.js';

/* ------------------------------------------------------------------
   Enquadramento

   heightRatio  — altura visual do cartão em relação à viewport
   centerRatio  — onde fica o centro do cartão (0 = topo, 1 = base)

   Os dois valores vêm da composição final de referência. A distância da
   câmera é derivada deles, então o cartão ocupa a mesma fração da tela
   em 1366×768 ou em 1920×1080.
------------------------------------------------------------------ */

const FRAMING = {
  desktop: { fov: 36, heightRatio: 0.46, centerRatio: 0.461 },
  mobile: { fov: 45, heightRatio: 0.37, centerRatio: 0.3 },
};

export class CardScene {
  constructor(canvas, stage) {
    this.canvas = canvas;
    this.stage = stage;

    this.visibleHeight = 1;
    this.finalY = 0;

    /* estado dirigido pela timeline (ver timeline.js) */
    this.state = {
      dy: -0.3, // deslocamento vertical em frações da altura visível
      z: -2,
      scale: 0.65,
      rx: -0.08,
      ry: -Math.PI / 2,
      rz: 0.08,
      float: 0, // 0 → 1 libera o micro floating do frame final
    };

    this.parallax = { x: 0, y: 0, targetX: 0, targetY: 0, enabled: false };

    this.clock = new THREE.Clock();
    this.rafId = 0;
    this.inView = true;
    this.pageVisible = !document.hidden;
    this.destroyed = false;

    this.onResize = this.onResize.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.tick = this.tick.bind(this);
  }

  async init(baseUrl) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      // leitura do buffer para captura de frames em dev
      preserveDrawingBuffer: import.meta.env.DEV,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    this.scene = new THREE.Scene();
    // o RoomEnvironment é claro demais para uma cena preta: entra só como
    // um traço de luz de ambiente, o desenho vem das luzes direcionais
    this.scene.environmentIntensity = 0.25;
    this.camera = new THREE.PerspectiveCamera(FRAMING.desktop.fov, 1, 0.1, 60);

    this.rig = new THREE.Group();
    this.rig.name = 'card-rig';
    this.scene.add(this.rig);

    this.buildLights();
    this.buildEnvironment();
    this.onResize();

    const textures = await loadCardTextures(baseUrl, this.renderer.capabilities.getMaxAnisotropy());
    this.card = createCard(textures);
    this.rig.add(this.card);

    this.apply();
    this.renderer.render(this.scene, this.camera);

    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
      },
      { rootMargin: '30% 0px' },
    );
    this.observer.observe(this.stage);

    this.tick();
    return this;
  }

  /* ---------------- iluminação de estúdio ---------------- */

  buildLights() {
    // preto sobre preto: a ambiente é fraquíssima, quem separa é a rim light
    this.scene.add(new THREE.HemisphereLight(0x9fb2c8, 0x04050a, 0.45));

    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-2.6, 2.4, 6.4);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x93a7bf, 0.7);
    fill.position.set(4.6, -1.4, 3.4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xe2ecf8, 2.25);
    rim.position.set(0.8, 1.6, -4.8);
    this.scene.add(rim);

    // realce lateral que revela a espessura quando o cartão está de perfil
    const edge = new THREE.DirectionalLight(0xc9d6e6, 1.0);
    edge.position.set(-5.2, 0.4, -1.2);
    this.scene.add(edge);
  }

  buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    this.scene.environment = this.environment;
    pmrem.dispose();
  }

  /* ---------------- layout ---------------- */

  onResize() {
    if (!this.renderer) return;

    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;
    if (!width || !height) return;

    // mesmo ponto de virada do CSS (card-experience.css)
    const framing = width < 1024 ? FRAMING.mobile : FRAMING.desktop;

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);

    this.visibleHeight = CARD_HEIGHT / framing.heightRatio;
    this.finalY = (0.5 - framing.centerRatio) * this.visibleHeight;

    this.camera.aspect = width / height;
    this.camera.fov = framing.fov;
    this.camera.position.z =
      this.visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(framing.fov) / 2));
    this.camera.updateProjectionMatrix();

    this.parallax.enabled = width >= 1024 && this.parallax.allowed === true;
    this.apply();
  }

  onVisibility() {
    this.pageVisible = !document.hidden;
  }

  /* ---------------- micro parallax de mouse (só no frame final) ---------------- */

  enableParallax() {
    if (this.parallax.allowed) return;
    this.parallax.allowed = true;
    this.parallax.enabled = this.stage.clientWidth >= 1024;
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
  }

  onPointerMove(event) {
    if (!this.parallax.enabled || event.pointerType !== 'mouse') return;
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;
    this.parallax.targetX = THREE.MathUtils.degToRad(1.5) * nx;
    this.parallax.targetY = THREE.MathUtils.degToRad(-1) * ny;
  }

  /* ---------------- render ---------------- */

  apply(elapsed = 0) {
    const { state, parallax } = this;
    const float = state.float;

    // floating extremamente lento, liberado só quando a timeline termina
    const floatY = Math.sin(elapsed * 0.55) * 0.014 * float;
    const floatRx = Math.sin(elapsed * 0.43 + 1.1) * THREE.MathUtils.degToRad(0.5) * float;
    const floatRy = Math.sin(elapsed * 0.37) * THREE.MathUtils.degToRad(0.8) * float;

    this.rig.position.set(0, this.finalY + state.dy * this.visibleHeight + floatY, state.z);
    this.rig.rotation.set(
      state.rx + floatRx + parallax.y * float,
      state.ry + floatRy + parallax.x * float,
      state.rz,
    );
    this.rig.scale.setScalar(state.scale);
  }

  tick() {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this.tick);
    if (!this.inView || !this.pageVisible) return;

    const elapsed = this.clock.getElapsedTime();
    this.parallax.x += (this.parallax.targetX - this.parallax.x) * 0.06;
    this.parallax.y += (this.parallax.targetY - this.parallax.y) * 0.06;

    this.apply(elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.observer?.disconnect();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.card?.userData.dispose?.();
    this.environment?.dispose();
    this.renderer?.dispose();
  }
}
