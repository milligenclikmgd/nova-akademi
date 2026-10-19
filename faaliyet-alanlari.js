(() => {
  const video = document.getElementById('activity-video');
  const sound = document.getElementById('activity-sound');
  const status = document.getElementById('activity-video-status');
  if (video && sound) {
    video.muted = true;
    video.volume = 0.35;
    const syncSound = () => {
      const audible = !video.muted && video.volume > 0;
      sound.textContent = audible ? 'Sesi kapat' : 'Sesi aç';
      sound.setAttribute('aria-pressed', String(audible));
    };
    const start = () => video.play().catch(() => {status.textContent = 'Videoyu başlatmak için oynat düğmesine dokunun.';});
    sound.addEventListener('click', () => {
      video.muted = !video.muted && video.volume > 0;
      if (!video.muted && video.volume === 0) video.volume = 0.35;
      syncSound();
      if (video.paused) start();
    });
    video.addEventListener('volumechange', syncSound);
    video.addEventListener('playing', () => {status.textContent = 'NOVA’yı keşfedin';});
    video.addEventListener('error', () => {status.textContent = 'Video oynatılamadı. Lütfen daha sonra tekrar deneyin.';});
    const base = location.hostname === 'nova-akademi.vercel.app' ? 'https://nova-akademi.milligenclikmgd.workers.dev' : '';
    fetch(base + '/api/site-media/activity-video', {cache:'no-store',signal:AbortSignal.timeout(8000)})
      .then(response => {if (!response.ok) throw Error('Video bilgisi alınamadı');return response.json();})
      .then(({video:media}) => {
        // Only a path on our media backend may replace the default NOVA video.
        if (!media || !/^\/api\/site-media\/activity-video\/file\?v=[a-f0-9-]+$/.test(media.url)) return;
        video.src = base + media.url;
        video.load();
        start();
      }).catch(() => { /* The bundled NOVA video remains playable offline. */ });
    syncSound();
    start();
  }
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
