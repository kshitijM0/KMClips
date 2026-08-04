/* ============================================================
   MAIN
   Wires the controls that don't warrant their own module (duration slider,
   output-quality/clip-count selects) and initializes every feature module
   once the DOM is ready. This is the only file that knows the init order.
   ============================================================ */

(function () {
  const { dom, state } = App;

  function updateSliderFill() {
    const min = Number(dom.durationSlider.min);
    const max = Number(dom.durationSlider.max);
    const val = Number(dom.durationSlider.value);
    const percent = ((val - min) / (max - min)) * 100;
    dom.durationSlider.style.setProperty('--fill', `${percent}%`);
  }

  /** Reveals Caption Style / Title Mode / Live Preview / Output settings / Create button. */
  function revealSettings() {
    dom.revealGroup.classList.add('is-revealed');
  }

  function initDurationSlider() {
    dom.durationSlider.addEventListener('input', () => {
      state.duration = Number(dom.durationSlider.value);
      dom.durationValue.textContent = state.duration;
      updateSliderFill();
      revealSettings(); // "When the user selects any duration, display Caption Style"
      App.preview.refresh();
    });
    updateSliderFill();
  }

  function initOutputSettings() {
    dom.qualitySelect.addEventListener('change', () => {
      state.quality = dom.qualitySelect.value;
      App.preview.refresh();
    });

    dom.clipsSelect.addEventListener('change', () => {
      state.clipCount = Number(dom.clipsSelect.value);
      App.preview.refresh();
    });
  }

  function init() {
    initDurationSlider();
    initOutputSettings();

    App.sources.init();
    App.captionStyles.init();
    App.titleMode.init();
    App.fonts.init();
    App.pipeline.init();

    App.preview.refresh();

    // Auto-reveal the settings below the slider shortly after load, since a
    // default duration (30s) counts as "selected" even before the user
    // touches the slider.
    setTimeout(revealSettings, 500);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
