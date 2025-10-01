(function () {
  const CONFIG = {
    STICKY_DURATION_VH: 150,
    FADE_DISTANCE_REM: 2,
    TRANSITION_MS: 520,
    EASING: 'cubic-bezier(0.22, 1, 0.36, 1)',
    USE_ZINDEX_STACKING: true
  };

  const setDesignTokens = () => {
    const root = document.documentElement;
    root.style.setProperty('--sticky-duration', `${CONFIG.STICKY_DURATION_VH}vh`);
    root.style.setProperty('--sticky-fade-distance', `${CONFIG.FADE_DISTANCE_REM}rem`);
    root.style.setProperty('--sticky-transition', `${CONFIG.TRANSITION_MS}ms`);
    root.style.setProperty('--sticky-easing', CONFIG.EASING);
  };

  const throttleFrame = (callback) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        callback.apply(null, args);
        ticking = false;
      });
    };
  };

  const initialiseStickyFlow = () => {
    const flow = document.querySelector('[data-sticky-flow]');
    if (!flow) return;

    const wrappers = Array.from(flow.querySelectorAll('[data-panel-wrapper]'));
    if (!wrappers.length) return;

    const useZIndexStacking = CONFIG.USE_ZINDEX_STACKING || flow.hasAttribute('data-use-zindex');

    wrappers.forEach((wrapper, index) => {
      const panel = wrapper.querySelector('.panel');
      if (!panel) return;
      panel.dataset.panelIndex = String(index);
      if (useZIndexStacking) {
        panel.style.zIndex = String(100 + index);
      }
    });

    let activeIndex = -1;

    const setActive = (nextIndex) => {
      const index = Math.max(0, Math.min(wrappers.length - 1, nextIndex));
      if (index === activeIndex) return;
      activeIndex = index;

      wrappers.forEach((wrapper, position) => {
        const panel = wrapper.querySelector('.panel');
        if (!panel) return;
        const isActive = position === index;
        panel.classList.toggle('is-active', isActive);
        panel.classList.toggle('is-prev', position < index);
        panel.classList.toggle('is-next', position === index + 1);
      });
    };

    const updateByViewport = () => {
      let candidateIndex = 0;
      let candidateScore = Number.POSITIVE_INFINITY;
      const viewportMiddle = window.innerHeight / 2;

      wrappers.forEach((wrapper, index) => {
        const rect = wrapper.getBoundingClientRect();
        const wrapperMiddle = rect.top + Math.min(rect.height, window.innerHeight) / 2;
        const distance = Math.abs(wrapperMiddle - viewportMiddle);
        if (distance < candidateScore) {
          candidateScore = distance;
          candidateIndex = index;
        }
      });

      setActive(candidateIndex);
    };

    const onScrollFallback = throttleFrame(updateByViewport);

    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const observerOptions = {
      root: null,
      threshold: thresholds,
      rootMargin: '-20% 0px -20% 0px'
    };

    const handleIntersections = (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .forEach((entry) => {
          const wrapper = entry.target;
          const index = wrappers.indexOf(wrapper);
          if (index === -1) return;
          if (entry.intersectionRatio >= 0.55) {
            setActive(index);
          }
        });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(handleIntersections, observerOptions);
      wrappers.forEach((wrapper) => observer.observe(wrapper));
      setActive(0);
    } else {
      window.addEventListener('scroll', onScrollFallback, { passive: true });
      window.addEventListener('resize', onScrollFallback);
      updateByViewport();
    }

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = () => {
      if (motionMedia.matches) {
        setActive(activeIndex === -1 ? 0 : activeIndex);
        return;
      }

      if ('IntersectionObserver' in window) {
        setActive(activeIndex === -1 ? 0 : activeIndex);
      } else {
        updateByViewport();
      }
    };

    motionMedia.addEventListener('change', applyMotionPreference);
    applyMotionPreference();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setDesignTokens();
      initialiseStickyFlow();
    });
  } else {
    setDesignTokens();
    initialiseStickyFlow();
  }
})();
