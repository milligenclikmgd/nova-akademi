(() => {
  const video = document.getElementById('activity-video');
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.play().catch(() => {
      // Muted autoplay is supported by modern browsers; retry when media becomes ready.
      video.addEventListener('canplay', () => video.play().catch(() => {}), {once:true});
    });
  }
  const timeline = document.querySelector('.activity-timeline');
  if (!timeline) return;
  const pointViewport = timeline.querySelector('.activity-timeline-viewport');
  const cardViewport = timeline.querySelector('.activity-cards-viewport');
  const pointTrack = timeline.querySelector('.activity-timeline-points');
  const cardTrack = timeline.querySelector('.activity-timeline-cards');
  const points = [...timeline.querySelectorAll('.activity-timeline-point')];
  const cards = [...timeline.querySelectorAll('.activity-timeline-card')];
  const announcement = timeline.querySelector('#activity-timeline-status');
  if (!points.length || points.length !== cards.length) return;
  let active = 0;
  const render = () => {
    pointViewport.scrollLeft = 0;
    cardViewport.scrollLeft = 0;
    const point = points[active], card = cards[active];
    pointTrack.style.transform = `translateX(${Math.round(pointViewport.clientWidth / 2 - point.offsetLeft - point.offsetWidth / 2)}px)`;
    cardTrack.style.transform = `translateX(${Math.round(cardViewport.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2)}px)`;
    points.forEach((button, index) => {
      button.classList.toggle('is-active', index === active);
      if (index === active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      cards[index].classList.toggle('is-active', index === active);
    });
  };
  const select = (index, focus = false) => {
    active = Math.max(0, Math.min(index, points.length - 1));
    render();
    announcement.textContent = cards[active].querySelector('h3').textContent;
    if (focus) points[active].focus({preventScroll:true});
  };
  points.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      const next = {ArrowRight:index + 1, ArrowLeft:index - 1, Home:0, End:points.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  let swipeStart = null;
  cardViewport.addEventListener('pointerdown', event => {
    if (event.isPrimary && event.button === 0) swipeStart = {x:event.clientX,y:event.clientY};
  });
  cardViewport.addEventListener('pointerup', event => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) select(active + (dx < 0 ? 1 : -1));
  });
  cardViewport.addEventListener('pointercancel', () => {swipeStart = null;});
  cardViewport.addEventListener('dragstart', event => event.preventDefault());
  new ResizeObserver(render).observe(pointViewport);
  render();
})();
