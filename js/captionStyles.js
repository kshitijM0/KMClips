/* ============================================================
   CAPTION STYLES
   Handles selecting one of the 6 caption style cards, and drives the tiny
   animated word cyclers used by the "Word By Word" and "Glow" previews.
   ============================================================ */

App.captionStyles = (function () {
  const { dom, state } = App;

  function handleGridClick(e) {
    const card = e.target.closest('.caption-card');
    if (!card) return;

    dom.captionGrid.querySelectorAll('.caption-card').forEach((c) => {
      c.classList.remove('is-selected');
      c.setAttribute('aria-checked', 'false');
    });
    card.classList.add('is-selected');
    card.setAttribute('aria-checked', 'true');

    state.captionStyle = card.dataset.style;
    App.preview.refresh();
  }

  /** Cycles the words inside any element with a data-words="a,b,c" attribute. */
  function initWordCyclers(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      const words = el.dataset.words.split(',');
      let i = 0;
      setInterval(() => {
        i = (i + 1) % words.length;
        // Restart the CSS animation on each swap for a clean transition
        el.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight; // force reflow
        el.textContent = words[i];
        el.style.animation = '';
      }, 1100);
    });
  }

  function init() {
    dom.captionGrid.addEventListener('click', handleGridClick);
    initWordCyclers('[data-words]');
  }

  return { init };
})();
