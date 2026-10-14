(() => {
  const track = document.getElementById('activity-track');
  const viewport = document.querySelector('.activity-viewport');
  if (!track || !viewport) return;
  const buttons = [...document.querySelectorAll('[data-direction]')];
  let index = 0;
  const render = () => {
    const step = track.querySelector('.activity-slide').getBoundingClientRect().width;
    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    const lastIndex = Math.ceil(maxOffset / step);
    index = Math.min(index, lastIndex);
    track.style.transform = `translateX(-${Math.min(index * step, maxOffset)}px)`;
    buttons[0].disabled = index === 0;
    buttons[1].disabled = index === lastIndex;
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    index = Math.max(0, index + Number(button.dataset.direction));
    render();
  }));
  new ResizeObserver(render).observe(viewport);
  render();
})();
