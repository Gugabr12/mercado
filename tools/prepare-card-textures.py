"""
Prepara as texturas do cartão 3D a partir das artes oficiais.

    python tools/prepare-card-textures.py

Entrada   frente.png e o verso (procurados subindo a árvore)
Saída     public/assets/card-front.webp  card-back.webp

A frente e o verso são a mesma peça física e dividem a mesma geometria,
então precisam ir para o MESMO retângulo sem esticar nenhuma das duas.

Regra:
  · a FRENTE é a referência e não é tocada além do recorte no alfa;
  · o VERSO casa a proporção CORTANDO ALTURA, não acolchoando largura.

O corte de altura mantém os textos laterais ("SAC: 0800…", "EMITIDO POR
MERCADO PAGO") encostados na borda. Acolchoar a largura empurraria esses
textos para dentro e o verso pareceria menor que o cartão.

Com `verso_mesmo_tamanho_frente.png` o corte dá zero: essa arte já vem
na mesma moldura da frente (0,6404 contra 0,6408 — 0,06% de diferença).
A regra continua no script para o caso de entrar uma arte fora de
esquadro.

A saída é ampliada por Lanczos porque em tela de alta densidade o cartão
chega a ~994px de altura: reamostrar uma vez, offline, rende ~14% mais
nitidez que deixar a GPU magnificar por bilinear.
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, 'public', 'assets')


def find_upwards(*names, start=HERE):
    """Sobe a árvore até achar o primeiro nome da lista que existir."""
    folder = start
    while True:
        for name in names:
            candidate = os.path.join(folder, name)
            if os.path.exists(candidate):
                return candidate
        parent = os.path.dirname(folder)
        if parent == folder:
            sys.exit(f'{" / ".join(names)} nao encontrado a partir de {start}')
        folder = parent

TARGET_HEIGHT = 994   # cartão a 46svh numa tela 1080 em DPR 2
BACK_NAMES = ('verso_mesmo_tamanho_frente.png', 'verso.png')  # na ordem de preferência
ALPHA_FLOOR = 200     # ignora a sombra suave em volta da arte
WEBP_QUALITY = 92


def crop_to_art(path):
    """Recorta a arte no limite real de alfa, descartando a sombra."""
    image = Image.open(path).convert('RGBA')
    alpha = np.array(image.getchannel('A'))
    ys, xs = np.where(alpha >= ALPHA_FLOOR)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    return image.crop(box).convert('RGB')


def main():
    front_path = find_upwards('frente.png')
    back_path = find_upwards(*BACK_NAMES)
    print(f'frente: {os.path.basename(front_path)}')
    print(f'verso : {os.path.basename(back_path)}')
    front = crop_to_art(front_path)
    back = crop_to_art(back_path)

    ratio = front.width / front.height
    print(f'frente {front.size}  razao {ratio:.4f}  (referencia)')
    print(f'verso  {back.size}  razao {back.width / back.height:.4f}')

    # o verso perde altura ate bater a razao da frente — sem esticar nada
    keep = round(back.width / ratio)
    excess = back.height - keep
    if excess < 0:
        sys.exit(f'verso mais largo que a frente ({excess}px) — revisar a regra de corte')

    if excess:
        top = round(excess * 0.52)  # sobra levemente maior no topo: la e so borda
        back = back.crop((0, top, back.width, top + keep))
        print(f'verso  cortado {excess}px de altura ({top} topo / {excess - top} base) -> {back.size}')
    else:
        print('verso  ja esta na moldura da frente — nenhum corte necessario')

    width = round(TARGET_HEIGHT * ratio)
    os.makedirs(OUT, exist_ok=True)

    for name, art in (('card-front', front), ('card-back', back)):
        out = art.resize((width, TARGET_HEIGHT), Image.LANCZOS)
        path = os.path.join(OUT, f'{name}.webp')
        out.save(path, quality=WEBP_QUALITY, method=6)
        print(f'{name}.webp {out.size} {os.path.getsize(path) // 1024} KB')

    print(f'\nCARD_RATIO em src/card-experience/Card3D.js: {width} / {TARGET_HEIGHT}')


if __name__ == '__main__':
    main()
