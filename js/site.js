// Mobile menu toggle + nav state over the home hero
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const btn = nav.querySelector('.menu-btn');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    const it = document.documentElement.lang === 'it';
    btn.textContent = open ? (it ? 'Chiudi' : 'Close') : 'Menu';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) btn.click();
  });

  const hero = document.querySelector('.hero-full');
  if (hero) {
    const update = () => nav.classList.toggle('solid', hero.getBoundingClientRect().bottom <= nav.offsetHeight);
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
  }

  // Process: sticky counter shows the last step whose top has passed 40% of the screen
  const stepN = document.getElementById('step-n');
  if (stepN) {
    const steps = [...document.querySelectorAll('.process li[data-step]')];
    let ticking = false;
    const sync = () => {
      ticking = false;
      const line = innerHeight * 0.4;
      let current = steps[0];
      for (const li of steps) if (li.getBoundingClientRect().top <= line) current = li;
      if (stepN.textContent !== current.dataset.step) stepN.textContent = current.dataset.step;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();
  }

  // Rotator: show one row at a time in a loop; pauses on hover/focus and when off screen
  document.querySelectorAll('[data-rotate]').forEach(box => {
    const rows = [...box.children];
    if (rows.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0, timer = null, visible = false, hold = false;
    rows[0].classList.add('active');
    const step = () => {
      const cur = rows[i]; i = (i + 1) % rows.length; const next = rows[i];
      cur.classList.remove('active'); cur.classList.add('leaving');
      setTimeout(() => cur.classList.remove('leaving'), 500);
      next.classList.add('active');
    };
    const run = () => { clearInterval(timer); timer = (visible && !hold) ? setInterval(step, 3000) : null; };
    box.addEventListener('mouseenter', () => { hold = true; run(); });
    box.addEventListener('mouseleave', () => { hold = false; run(); });
    box.addEventListener('focusin', () => { hold = true; run(); });
    box.addEventListener('focusout', () => { hold = false; run(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { threshold: 0.5 }).observe(box);
    } else { visible = true; run(); }
  });

  /* Hero background: loop through the photos, one at a time */
  document.querySelectorAll('[data-slides]').forEach(box => {
    const imgs = [...box.querySelectorAll('img')];
    if (imgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      imgs.forEach(img => img.classList.remove('prev'));
      imgs[i].classList.replace('on', 'prev');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('on');
    }, 6000);
  });

  /* Client reviews: dots turn into a line when active; auto-advance until someone picks one */
  document.querySelectorAll('[data-carousel]').forEach(box => {
    const slides = [...box.querySelectorAll('.slide')];
    const dots = [...box.querySelectorAll('.dots button')];
    if (slides.length < 2) return;
    let i = 0, timer = null, stopped = false;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('on', k === i); k === i ? s.removeAttribute('aria-hidden') : s.setAttribute('aria-hidden', 'true'); });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      if (stopped || timer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(() => { if (!document.hidden) show(i + 1); }, 7000);
    };
    dots.forEach((d, k) => d.addEventListener('click', () => { stopped = true; stop(); show(k); }));
    box.addEventListener('mouseenter', stop);
    box.addEventListener('mouseleave', start);
    box.addEventListener('focusin', stop);
    box.addEventListener('focusout', start);
    start();
  });

  /* Share the nav height so sticky bars sit right under it */
  const navEl = document.querySelector('.nav');
  if (navEl) {
    const setNavH = () => document.documentElement.style.setProperty('--nav-h', navEl.querySelector('.grid').offsetHeight + 'px');
    setNavH(); addEventListener('resize', setNavH);
  }

  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();
