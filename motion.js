(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = document.querySelectorAll(
    '.hero, .section-heading, .value-grid > div, .demo-frame, .price-card, .process > li, .closing, .panel'
  );
  let observer;

  function revealAll() {
    observer?.disconnect();
    targets.forEach((element) => element.classList.remove('reveal-pending'));
    document.querySelectorAll('.is-updating').forEach((element) => element.classList.remove('is-updating'));
  }

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.remove('reveal-pending');
        observer.unobserve(target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    targets.forEach((element) => {
      element.classList.add('reveal-ready', 'reveal-pending');
      observer.observe(element);
    });
    // Keyboard navigation must never land on invisible content.
    document.addEventListener('focusin', (event) => {
      const target = event.target.closest('.reveal-pending');
      if (target) {
        target.classList.remove('reveal-pending');
        observer.unobserve(target);
      }
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) revealAll();
  });

  const metrics = [...document.querySelectorAll('.metric-value')];
  const previousValues = new Map(metrics.map((element) => [element, element.textContent]));
  const frames = new Map();
  metrics.forEach((element) => element.addEventListener('animationend', () => {
    element.classList.remove('is-updating');
  }));
  document.addEventListener('calculator:updated', () => {
    metrics.forEach((element) => {
      const value = element.textContent;
      if (previousValues.get(element) === value) return;
      previousValues.set(element, value);
      cancelAnimationFrame(frames.get(element));
      element.classList.remove('is-updating');
      if (reducedMotion.matches) return;
      // Two frames restart feedback without forcing synchronous layout on every input.
      frames.set(element, requestAnimationFrame(() => {
        frames.set(element, requestAnimationFrame(() => {
          if (!reducedMotion.matches) element.classList.add('is-updating');
        }));
      }));
    });
  });
})();
