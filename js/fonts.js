/* ============================================================
   FONTS
   Wires the Title Font and Caption Font dropdowns. Both simply update
   state and delegate to App.preview.refresh() so the live preview (and
   nothing else) re-renders — no duplicated preview logic here.
   ============================================================ */

App.fonts = (function () {
  const { dom, state } = App;

  function init() {
    dom.titleFontSelect.addEventListener('change', () => {
      state.titleFont = dom.titleFontSelect.value;
      App.preview.refresh();
    });

    dom.captionFontSelect.addEventListener('change', () => {
      state.captionFont = dom.captionFontSelect.value;
      App.preview.refresh();
    });
  }

  return { init };
})();
