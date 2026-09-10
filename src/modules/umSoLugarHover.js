/**
 * "Tudo em um só lugar" — passar o mouse (ou focar pelo teclado) num
 * item da lista numerada troca a foto ao lado, com crossfade.
 *
 * Duas <img> ficam empilhadas dentro de .um-so-lugar__media; trocar de
 * foto alterna qual das duas tem a classe .is-active (opacity 1) — quem
 * cuida da transição suave é o CSS (`transition: opacity`), não o JS.
 * A imagem nova é pré-carregada antes de entrar, pra não aparecer em
 * branco no primeiro hover de cada foto.
 */
export function initUmSoLugarHover() {
  const section = document.querySelector('.um-so-lugar');
  const items = Array.from(section?.querySelectorAll('.um-so-lugar__item') ?? []);
  const images = Array.from(section?.querySelectorAll('.um-so-lugar__media img') ?? []);
  if (!section || items.length === 0 || images.length < 2) return;

  // usa o mesmo formato de string do data-image (caminho relativo), não
  // o src já resolvido pelo navegador — senão a primeira comparação de
  // "já é essa a imagem atual" nunca bate e troca à toa no 1º hover
  const defaultSrc = items[0]?.dataset.image;
  let currentSrc = defaultSrc;

  function show(src) {
    if (!src || src === currentSrc) return;
    currentSrc = src;

    const front = images.find((img) => img.classList.contains('is-active'));
    const back = images.find((img) => img !== front);
    if (!front || !back) return;

    const reveal = () => {
      back.classList.add('is-active');
      front.classList.remove('is-active');
    };

    back.src = src;
    if (back.complete) reveal();
    else back.addEventListener('load', reveal, { once: true });
  }

  items.forEach((item) => {
    const src = item.dataset.image;
    if (!src) return;
    item.addEventListener('mouseenter', () => show(src));
    item.addEventListener('focus', () => show(src));
  });

  section.addEventListener('mouseleave', () => show(defaultSrc));
  section.addEventListener(
    'focusout',
    (event) => {
      if (!section.contains(event.relatedTarget)) show(defaultSrc);
    },
    true,
  );
}
