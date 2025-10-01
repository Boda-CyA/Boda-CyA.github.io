(function () {
  const supportsStickyPosition = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const testElement = document.createElement('div');
    const values = ['sticky', '-webkit-sticky'];
    return values.some(value => {
      testElement.style.position = value;
      return testElement.style.position === value;
    });
  };

  const throttle = (fn, wait = 60) => {
    let timeoutId = null;
    let lastCall = 0;
    return function throttledFn(...args) {
      const now = Date.now();
      const remaining = wait - (now - lastCall);
      const invoke = () => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      };
      if (remaining <= 0 || remaining > wait) {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        lastCall = now;
        fn.apply(this, args);
      } else if (!timeoutId) {
        timeoutId = window.setTimeout(invoke, remaining);
      }
    };
  };

  const initializeStickyFlow = () => {
    const container =
      document.querySelector('#sticky-flow') ||
      document.querySelector('[data-sticky-flow]') ||
      document.querySelector('main');

    if (!container) return;

    const sections = Array.from(container.children).filter(child => child.tagName && child.tagName.toLowerCase() === 'section');
    if (!sections.length) return;

    container.classList.add('sticky-flow');

    sections.forEach(section => {
      section.classList.add('panel');
    });

    const hasStickySupport = supportsStickyPosition();
    if (!hasStickySupport) {
      container.classList.add('sticky-flow--no-sticky');
    }

    let activeIndex = -1;
    let rafId = null;
    let initialized = false;
    let panelPositions = [];

    const measurePanelPositions = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      container.classList.add('sticky-flow--measuring');
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top + currentScrollY;
      panelPositions = sections.map(panel => containerTop + panel.offsetTop);
      container.classList.remove('sticky-flow--measuring');
      window.scrollTo(0, currentScrollY);
    };

    const applyStates = index => {
      if (index < 0 || index >= sections.length) return;
      activeIndex = index;
      sections.forEach((panel, panelIndex) => {
        panel.classList.toggle('is-active', panelIndex === index);
        panel.classList.toggle('is-prev', panelIndex === index - 1);
        panel.classList.toggle('is-next', panelIndex === index + 1);
      });
    };

    const updateStates = () => {
      rafId = null;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!panelPositions.length) {
        measurePanelPositions();
      }

      const focusLine = (window.scrollY || window.pageYOffset || 0) + viewportHeight * 0.35;
      let bestIndex = 0;

      for (let index = 0; index < panelPositions.length; index += 1) {
        const panelPosition = panelPositions[index];
        if (focusLine >= panelPosition) {
          bestIndex = index;
        } else {
          break;
        }
      }

      applyStates(bestIndex);

      if (!initialized) {
        container.classList.add('sticky-flow--initialized');
        initialized = true;
      }
    };

    const requestStateUpdate = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(updateStates);
    };

    const throttledRequestUpdate = throttle(() => {
      measurePanelPositions();
      requestStateUpdate();
    }, 120);

    const handleScroll = throttle(requestStateUpdate, 60);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', throttledRequestUpdate);
    window.addEventListener('orientationchange', throttledRequestUpdate);

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        measurePanelPositions();
        requestStateUpdate();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('load', () => {
      measurePanelPositions();
      requestStateUpdate();
    }, { once: true });

    measurePanelPositions();
    applyStates(0);
    requestStateUpdate();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStickyFlow, { once: true });
  } else {
    initializeStickyFlow();
  }
})();
