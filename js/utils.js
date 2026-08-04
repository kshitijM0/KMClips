/* ============================================================
   UTILS
   Shared, dependency-free helper functions. Defines the single global
   `App` namespace that every other module attaches to, so plain
   (non-module) scripts can share state without polluting `window`
   with dozens of separate globals.
   ============================================================ */

window.App = window.App || {};

App.utils = (function () {
  const toastStack = document.getElementById('toastStack');

  /** Shows a small auto-dismissing toast at the bottom of the screen. */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  /** Attaches a material-style ripple effect to a button on click. */
  function attachRipple(button) {
    button.addEventListener('click', (e) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  /** Formats a whole number of seconds as m:ss. */
  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Flips an aria-checked switch element and returns its new boolean state. */
  function toggleSwitch(switchEl) {
    const next = switchEl.getAttribute('aria-checked') !== 'true';
    switchEl.setAttribute('aria-checked', String(next));
    return next;
  }

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  return { showToast, attachRipple, formatTime, wait, toggleSwitch, randomChoice };
})();
