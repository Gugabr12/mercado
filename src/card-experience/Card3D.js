import * as THREE from 'three';

/* ------------------------------------------------------------------
   Proporções

   As texturas em public/assets são recortes normalizados de
   frente.png / verso.png: as duas foram levadas ao MESMO aspect ratio
   sem qualquer esticamento (o verso ganhou uma calha lateral na cor da
   própria borda). Por isso a razão do cartão vem direto da textura —
   o mapeamento UV fica 1:1 e nenhuma letra é distorcida.

   Elas são gravadas em 637×994 (Lanczos a partir do recorte de 478×746)
   porque em tela de alta densidade o cartão chega a ~994px de altura —
   reamostrar uma vez, offline, rende ~14% mais nitidez que deixar a GPU
   magnificar por bilinear. Em WebP q92 as duas somam 129 KB, contra
   827 KB dos PNGs anteriores.
------------------------------------------------------------------ */

export const CARD_HEIGHT = 3.15;
export const CARD_RATIO = 637 / 994; // 0.64084 — razão real das artes normalizadas
export const CARD_WIDTH = CARD_HEIGHT * CARD_RATIO;
export const CARD_DEPTH = 0.046;

const CORNER = 0.145;
const BEVEL = 0.007;
const FACE_INSET = 0.016; // mantém a arte logo por dentro do bevel

/** Shape de retângulo arredondado, centrado na origem. */
function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

/**
 * Plano arredondado com UV normalizado sobre o próprio retângulo,
 * de modo que a textura ocupe exatamente a face — sem crop, sem stretch.
 */
function roundedFaceGeometry(width, height, radius) {
  const geometry = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 16);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  for (let i = 0; i < position.count; i += 1) {
    uv.setXY(i, position.getX(i) / width + 0.5, position.getY(i) / height + 0.5);
  }
  uv.needsUpdate = true;

  return geometry;
}

function configureTexture(texture, maxAnisotropy) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function loadCardTextures(baseUrl, maxAnisotropy) {
  const loader = new THREE.TextureLoader();

  return Promise.all([
    loader.loadAsync(`${baseUrl}assets/card-front.webp`),
    loader.loadAsync(`${baseUrl}assets/card-back.webp`),
  ]).then(([front, back]) => ({
    front: configureTexture(front, maxAnisotropy),
    back: configureTexture(back, maxAnisotropy),
  }));
}

/**
 * Objeto tridimensional real: corpo extrudado com cantos arredondados e
 * bevel discreto, face frontal, face traseira e espessura visível.
 */
export function createCard({ front, back }) {
  const group = new THREE.Group();
  group.name = 'mercado-pago-card';

  /* ---------- corpo: espessura + cantos + bevel ---------- */

  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRectShape(CARD_WIDTH, CARD_HEIGHT, CORNER), {
      depth: CARD_DEPTH - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelOffset: 0,
      bevelSegments: 2,
      curveSegments: 24,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x101215,
      roughness: 0.5,
      metalness: 0.15,
      clearcoat: 0.4,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.45,
    }),
  );
  body.geometry.center();
  body.name = 'card-body';
  group.add(body);

  /* ---------- faces com a arte oficial ---------- */

  const faceGeometry = roundedFaceGeometry(
    CARD_WIDTH - FACE_INSET,
    CARD_HEIGHT - FACE_INSET,
    CORNER - FACE_INSET / 2,
  );

  const faceMaterial = (map) =>
    new THREE.MeshPhysicalMaterial({
      map,
      // superfície fosca: a arte já é o desenho, o brilho não pode competir
      roughness: 0.86,
      metalness: 0.04,
      clearcoat: 0.12,
      clearcoatRoughness: 0.75,
      envMapIntensity: 0.1,
      // garante que a arte nunca "apague" quando a face gira para longe da luz
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: 0.16,
    });

  const frontFace = new THREE.Mesh(faceGeometry, faceMaterial(front));
  frontFace.name = 'card-front';
  frontFace.position.z = CARD_DEPTH / 2 + 0.0012;
  group.add(frontFace);

  // rotação de 180° em Y: a face olha para -z e o texto continua legível
  // (o eixo U acompanha a inversão do eixo X, então nada aparece espelhado)
  const backFace = new THREE.Mesh(faceGeometry.clone(), faceMaterial(back));
  backFace.name = 'card-back';
  backFace.rotation.y = Math.PI;
  backFace.position.z = -CARD_DEPTH / 2 - 0.0012;
  group.add(backFace);

  group.userData.dispose = () => {
    group.traverse((object) => {
      object.geometry?.dispose?.();
      object.material?.dispose?.();
    });
    front.dispose();
    back.dispose();
  };

  return group;
}
