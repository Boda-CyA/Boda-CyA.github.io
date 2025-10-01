(function () {
  const SESSION_KEY = 'envelopeOpened';

  const safeSessionGet = () => {
    try {
      return window.sessionStorage.getItem(SESSION_KEY);
    } catch (error) {
      return null;
    }
  };

  const safeSessionSet = value => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, value);
    } catch (error) {
      // Ignore storage errors (private mode, etc.)
    }
  };

  const focusElement = element => {
    if (!element || typeof element.focus !== 'function') {
      return;
    }
    const previousTabIndex = element.getAttribute('tabindex');
    if (previousTabIndex == null) {
      element.setAttribute('tabindex', '-1');
      element.addEventListener(
        'blur',
        () => {
          if (element.getAttribute('tabindex') === '-1') {
            element.removeAttribute('tabindex');
          }
        },
        { once: true }
      );
    }
    try {
      element.focus({ preventScroll: false });
    } catch (error) {
      element.focus();
    }
  };

  const initializeIntro = () => {
    const intro = document.getElementById('envelope-intro');
    const main = document.getElementById('invite');
    const openButton = document.getElementById('open-envelope');
    const skipButton = document.getElementById('skip-intro');

    if (!intro || !main || !openButton || !skipButton) {
      if (main) {
        main.setAttribute('aria-hidden', 'false');
      }
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let introActive = false;
    let animationTimeoutId = null;
    let fallbackTimeoutId = null;

    const lockScroll = () => {
      html.classList.add('intro-locked');
      body.classList.add('intro-active');
    };

    const unlockScroll = () => {
      html.classList.remove('intro-locked');
      body.classList.remove('intro-active');
    };

    const clearTimers = () => {
      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
        animationTimeoutId = null;
      }
      if (fallbackTimeoutId) {
        window.clearTimeout(fallbackTimeoutId);
        fallbackTimeoutId = null;
      }
    };

    const focusMainContent = () => {
      const focusCandidate =
        document.querySelector('[data-site-brand]') ||
        main.querySelector('[data-hero-names]') ||
        main.querySelector('h1, h2, h3, a, button');
      if (focusCandidate) {
        focusElement(focusCandidate);
      } else {
        focusElement(main);
      }
    };

    const finishIntro = ({ storeSession = true } = {}) => {
      if (!introActive) {
        main.setAttribute('aria-hidden', 'false');
        return;
      }

      introActive = false;
      intro.classList.add('opened');
      intro.classList.remove('opening');
      intro.setAttribute('aria-hidden', 'true');
      unlockScroll();
      main.setAttribute('aria-hidden', 'false');
      if (storeSession) {
        safeSessionSet('1');
      }
      clearTimers();

      window.setTimeout(() => {
        if (document.activeElement === openButton || document.activeElement === skipButton) {
          focusMainContent();
        }
      }, 120);
    };

    const startOpening = () => {
      if (!introActive || intro.classList.contains('opening')) {
        return;
      }
      intro.classList.add('opening');
      openButton.disabled = true;
      skipButton.disabled = true;

      const animationDuration = reduceMotionQuery.matches ? 0 : 1700;

      animationTimeoutId = window.setTimeout(() => {
        skipButton.disabled = false;
        finishIntro();
      }, animationDuration);
    };

    const skipIntro = () => {
      if (!introActive) {
        return;
      }
      skipButton.disabled = true;
      finishIntro();
    };

    const prepareIntro = () => {
      introActive = true;
      intro.classList.remove('opened');
      intro.style.display = '';
      intro.removeAttribute('aria-hidden');
      lockScroll();
      main.setAttribute('aria-hidden', 'true');
      openButton.disabled = false;
      skipButton.disabled = false;

      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          openButton.focus();
        }, 120);
      });

      fallbackTimeoutId = window.setTimeout(() => {
        if (!introActive) {
          return;
        }
        if (!intro.classList.contains('opening')) {
          startOpening();
        }
      }, 6000);
    };

    const shouldSkipIntro = () => safeSessionGet() === '1';

    main.setAttribute('aria-hidden', 'false');
    intro.setAttribute('aria-hidden', 'true');

    if (shouldSkipIntro()) {
      intro.classList.add('opened');
      intro.setAttribute('aria-hidden', 'true');
      intro.style.display = 'none';
      unlockScroll();
      safeSessionSet('1');
      return;
    }

    prepareIntro();

    openButton.addEventListener('click', startOpening);
    openButton.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        startOpening();
      }
    });

    skipButton.addEventListener('click', () => {
      clearTimers();
      skipIntro();
    });

    document.addEventListener('keydown', event => {
      if (!introActive) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        clearTimers();
        skipIntro();
      }
    });

    const reduceMotionListener = event => {
      if (!introActive) {
        return;
      }
      if (event.matches) {
        clearTimers();
        finishIntro({ storeSession: false });
      }
    };

    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', reduceMotionListener);
    } else if (typeof reduceMotionQuery.addListener === 'function') {
      reduceMotionQuery.addListener(reduceMotionListener);
    }

    intro.addEventListener('transitionend', event => {
      if (event.target === intro && intro.classList.contains('opened')) {
        intro.style.display = 'none';
      }
    });

    window.addEventListener('pageshow', event => {
      if (event.persisted && safeSessionGet() === '1') {
        intro.classList.add('opened');
        intro.style.display = 'none';
        unlockScroll();
        main.setAttribute('aria-hidden', 'false');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIntro);
  } else {
    initializeIntro();
  }
})();
