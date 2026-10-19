(()=> {
  const animateRing = ring => {
    if (ring.dataset.started) return;
    ring.dataset.started = 'true';
    const target = Number(ring.dataset.target || 0);
    const fill = Number(ring.style.getPropertyValue('--fill') || 1);
    const value = ring.querySelector('.number-value');
    const duration = 1450, start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      value.textContent = Math.round(target * eased);
      ring.style.setProperty('--progress', String(fill * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const animateSquareNumber = value => {
    if (value.dataset.started) return;
    value.dataset.started = 'true';
    const target = Number(value.dataset.target || 0);
    const duration = 1250, start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      value.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.matches('[data-counter-group]')) {
        entry.target.querySelectorAll('.number-ring').forEach(animateRing);
      }
      if (entry.target.matches('[data-square-counter-group]')) {
        entry.target.querySelectorAll('.square-stat__number').forEach(animateSquareNumber);
      }
      observer.unobserve(entry.target);
    });
  }, {threshold:.22});
  document.querySelectorAll('.reveal,[data-counter-group],[data-square-counter-group]').forEach(el => observer.observe(el));
  document.querySelectorAll('.art-card').forEach(card => card.addEventListener('click', () => {
    const expanded = card.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.art-card').forEach(item => item.setAttribute('aria-expanded', 'false'));
    card.setAttribute('aria-expanded', String(!expanded));
  }));
})();