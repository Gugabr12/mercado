/** Menu compacto: reaproveita os mesmos itens do desktop em um painel. */
export function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const burger = navbar?.querySelector('.navbar__burger');
  if (!navbar || !burger) return;

  const toggle = (open) => {
    navbar.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  burger.addEventListener('click', () => toggle(!navbar.classList.contains('is-open')));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggle(false);
  });

  document.addEventListener('click', (event) => {
    if (!navbar.contains(event.target)) toggle(false);
  });
}
