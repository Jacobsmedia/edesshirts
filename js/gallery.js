// Gallery: stage filter + full-screen viewer
(() => {
  const buttons = [...document.querySelectorAll('.g-filter button')];
  const stages = [...document.querySelectorAll('.stage')];

  // Filter
  buttons.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    stages.forEach(s => { s.hidden = f !== 'all' && s.dataset.stage !== f; });
    const top = document.querySelector('.g-filter').getBoundingClientRect().top + scrollY;
    if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));

  // Viewer
  const dlg = document.getElementById('viewer');
  if (!dlg || typeof dlg.showModal !== 'function') return; // falls back to opening the image link
  const img = document.getElementById('v-img');
  const cap = document.getElementById('v-cap');
  const count = document.getElementById('v-count');
  let list = [], i = 0, opener = null;

  const visibleShots = () => [...document.querySelectorAll('.stage:not([hidden]) .shot')];

  const show = n => {
    i = (n + list.length) % list.length;
    const fig = list[i];
    const a = fig.querySelector('a');
    const im = fig.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = im.alt;
    cap.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = fig.querySelector('.idx').textContent;
    cap.append(b, document.createTextNode(fig.querySelector('figcaption').textContent));
    count.textContent = `${i + 1} / ${list.length}`;
  };

  document.querySelectorAll('.shot a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    list = visibleShots();
    opener = a;
    show(list.indexOf(a.closest('.shot')));
    dlg.showModal();
  }));

  document.getElementById('v-prev').addEventListener('click', () => show(i - 1));
  document.getElementById('v-next').addEventListener('click', () => show(i + 1));
  document.getElementById('v-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { if (opener) opener.focus(); });

  // Swipe on touch screens
  let x0 = null;
  dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
