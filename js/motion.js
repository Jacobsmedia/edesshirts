/* Light motion with GSAP: photo parallax, a headline intro, banner cards easing in.
   Runs only when GSAP loaded and the visitor has not asked for reduced motion. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    /* Headline intro on load: title, then the line under it, then the buttons */
    const head = document.querySelector('.hero-full .grid, .page-head');
    if (head) {
      const parts = head.querySelectorAll('h1, .sub, .actions, .acts');
      gsap.from(parts, { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.1, clearProps: 'transform,opacity,visibility' });
    }

    /* Home hero: the photos drift slower than the page */
    const heroBg = document.querySelector('.hero-full .bg');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: '.hero-full', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    /* Large photos on inner pages: a slow drift inside their frame */
    document.querySelectorAll('.page-head .photo img, .photo.ratio-wide img').forEach(img => {
      gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
        yPercent: 6, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: img.closest('.photo'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* Banner cards ease up once as they arrive */
    document.querySelectorAll('.tender-panel').forEach(panel => {
      gsap.from(panel, {
        y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: panel, start: 'top 85%', once: true }
      });
    });
  });
})();
