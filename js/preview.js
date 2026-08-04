/* ============================================================
   PREVIEW
   "Better Preview": one central refresh() function that re-renders the
   phone mockup from the current state. Every input handler in the app
   calls this instead of touching the DOM itself, so there is exactly one
   place that knows how to draw the preview — no duplicated rendering
   logic, no stale views.
   ============================================================ */

App.preview = (function () {
  const { dom, state } = App;

  // Representative sample text for each caption style, shown in the preview
  const STYLE_PREVIEW_TEXT = {
    mrbeast: 'NO WAY',
    wordbyword: 'EVERYTHING',
    clean: "Let's get into it.",
    gaming: 'CLUTCH!',
    cinema: 'Every story matters.',
    glow: 'soft glow captions',
  };

  function refresh() {
    // Output format: 1:1 square (Title Mode) vs 9:16 vertical
    dom.phoneMock.classList.toggle('is-square', state.titleMode);
    dom.phoneMockTitleBar.textContent = state.titleMode ? (state.generatedTitle || 'TITLE') : 'TITLE';
    dom.phoneMockTitleBar.style.fontFamily = `'${state.titleFont}', sans-serif`;

    // Caption preview keeps each style's signature effect (stroke/glow/etc.)
    // via its CSS class, but renders in whichever font the user picked.
    dom.phoneMockCaptionText.textContent = STYLE_PREVIEW_TEXT[state.captionStyle] || '';
    dom.phoneMockCaptionText.className = `lp-style lp-${state.captionStyle}`;
    dom.phoneMockCaptionText.style.fontFamily = `'${state.captionFont}', sans-serif`;

    // Meta chips
    dom.previewDurationTag.textContent = `${state.duration}s`;
    dom.previewQualityTag.textContent = state.quality.toUpperCase();
    dom.previewClipsTag.textContent = `${state.clipCount} clip${state.clipCount > 1 ? 's' : ''}`;
    dom.previewFormatTag.textContent = state.titleMode ? '1:1' : '9:16';
  }

  return { refresh };
})();
