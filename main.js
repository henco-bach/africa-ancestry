(() => {
  const doc = document;
  const isMobileLike =
    (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 900px)").matches) ||
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) ||
    (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Keep footer year current.
  const yearEl = doc.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile navigation toggle.
  const menuToggle = doc.querySelector('.menu-toggle');
  const nav = doc.getElementById('site-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Reveal animations: use IntersectionObserver when available, else show all immediately.
  const revealEls = Array.from(doc.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // How-it-works timeline progress on scroll.
  const howSection = doc.querySelector('[data-how-section]');
  const timelineFill = doc.querySelector('[data-timeline-fill]');
  if (howSection && timelineFill) {
    let timelineTicking = false;
    const updateTimeline = () => {
      const rect = howSection.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const total = rect.height + viewport * 0.55;
      const progressed = viewport * 0.45 - rect.top;
      const value = Math.max(0, Math.min(1, progressed / total));
      timelineFill.style.setProperty('--timeline-progress', value.toFixed(3));
      timelineTicking = false;
    };

    const onTimelineScroll = () => {
      if (timelineTicking) return;
      timelineTicking = true;
      window.requestAnimationFrame(updateTimeline);
    };

    updateTimeline();
    window.addEventListener('scroll', onTimelineScroll, { passive: true });
    window.addEventListener('resize', updateTimeline);
  }

  // Light parallax in hero.
  const hero = doc.querySelector('[data-parallax]');
  if (hero && !isMobileLike) {
    const backdrop = hero.querySelector('.hero-backdrop');
    if (backdrop) {
      let parallaxTicking = false;
      const updateParallax = () => {
        const rect = hero.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const viewportCenterY = (window.innerHeight || 1) / 2;
        const deltaY = (viewportCenterY - centerY) * 0.02;
        backdrop.style.setProperty('--parallax-y', `${deltaY.toFixed(2)}px`);
        parallaxTicking = false;
      };

      const onParallaxScroll = () => {
        if (parallaxTicking) return;
        parallaxTicking = true;
        window.requestAnimationFrame(updateParallax);
      };

      updateParallax();
      window.addEventListener('scroll', onParallaxScroll, { passive: true });
      window.addEventListener('resize', updateParallax);
    }
  }

  // Decorative embers.
  const embersHost = doc.querySelector('.embers');
  if (embersHost && !isMobileLike) {
    const count = 24;
    for (let i = 0; i < count; i += 1) {
      const ember = doc.createElement('span');
      ember.className = 'ember';
      const size = 2 + Math.random() * 5;
      ember.style.setProperty('--size', `${size.toFixed(2)}px`);
      ember.style.left = `${(Math.random() * 100).toFixed(2)}%`;
      ember.style.top = `${(70 + Math.random() * 30).toFixed(2)}%`;
      ember.style.animationDuration = `${(5 + Math.random() * 7).toFixed(2)}s`;
      ember.style.animationDelay = `${(-Math.random() * 8).toFixed(2)}s`;
      embersHost.appendChild(ember);
    }
  }
})();
