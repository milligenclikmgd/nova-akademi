(() => {
  const track = document.getElementById('activity-track');
  if (!track) return;
  const buttons = [...document.querySelectorAll('[data-direction]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    buttons[0].disabled = track.scrollLeft <= 2;
    buttons[1].disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const move = direction => track.scrollBy({
    left: direction * (track.querySelector('.activity-slide').getBoundingClientRect().width),
    behavior: reducedMotion.matches ? 'instant' : 'smooth'
  });
  buttons.forEach(button => button.addEventListener('click', () => move(Number(button.dataset.direction))));
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(track);
  sync();
})();
