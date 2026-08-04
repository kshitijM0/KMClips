/* ============================================================
   SOURCES
   Detects which supported platform a pasted URL belongs to (YouTube, Kick,
   Dropbox, Google Drive file, Google Drive folder), and keeps the input's
   validity state, hint text, detected-platform chip, and legend badges in
   sync as the user types.
   ============================================================ */

App.sources = (function () {
  const { dom, state } = App;

  // Small inline icons reused for the detected-platform chip inside the input
  const ICONS = {
    youtube: '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#FF3B3B" d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8z"/><path fill="#0b0e14" d="M9.6 15.5V8.5L15.8 12z"/></svg>',
    kick: '<svg width="14" height="14" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#53FC18"/><path fill="#0b0e14" d="M5 6h3v4.2L11 6h3.6L11 11l3.8 7h-3.5l-2.5-5-1.3 1.6V18H5V6z"/></svg>',
    dropbox: '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#0061FF" d="M6 3l6 3.8L6 10.6.2 6.8 6 3zm12 0l5.8 3.8L18 10.6l-6-3.8L18 3zM6 11.4l6 3.8-6 3.8-5.8-3.8L6 11.4zm12 0l6 3.8-6 3.8-6-3.8 6-3.8zM12 16l6 3.8-6 3.6-6-3.6L12 16z"/></svg>',
    'gdrive-file': '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#FFC107" d="M8.5 3h7l7.5 13-3.5 6h-15l-3.5-6z"/><path fill="#1976D2" d="M8.5 3l-7.5 13h7l7.5-13z"/><path fill="#4CAF50" d="M12.5 16l-3.5 6h15l-3.5-6z"/></svg>',
    'gdrive-folder': '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#FFCA28" d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v2H3z"/><path fill="#FFA000" d="M3 8h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
  };

  // Ordered so the more specific Google Drive "folder" pattern is checked
  // before the generic "file" pattern.
  const PATTERNS = [
    { platform: 'gdrive-folder', regex: /drive\.google\.com\/drive\/folders/i },
    { platform: 'gdrive-file', regex: /drive\.google\.com\/file|docs\.google\.com/i },
    { platform: 'dropbox', regex: /dropbox\.com/i },
    { platform: 'youtube', regex: /youtu\.?be/i },
    { platform: 'kick', regex: /kick\.com/i },
  ];

  /** Returns the matching platform key for a URL, or null if unsupported. */
  function detectPlatform(url) {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const match = PATTERNS.find((p) => p.regex.test(trimmed));
    return match ? match.platform : null;
  }

  function updateBadges(platform) {
    dom.platformBadges.querySelectorAll('.badge').forEach((badge) => {
      badge.classList.toggle('is-active', badge.dataset.source === platform);
    });
  }

  function updateDetectedChip(platform) {
    if (platform) {
      dom.detectedChip.innerHTML = ICONS[platform];
      dom.detectedChip.classList.add('is-visible');
    } else {
      dom.detectedChip.classList.remove('is-visible');
    }
  }

  function handleInput() {
    state.videoUrl = dom.urlInput.value;
    const hasValue = state.videoUrl.trim().length > 0;
    const platform = detectPlatform(state.videoUrl);
    state.sourcePlatform = platform;

    dom.urlInput.classList.toggle('is-valid', hasValue && !!platform);
    dom.urlInput.classList.toggle('is-invalid', hasValue && !platform);

    updateBadges(platform);
    updateDetectedChip(platform);

    dom.urlHint.textContent = !hasValue
      ? 'We only read the public stream — nothing is uploaded until you click Create.'
      : platform
        ? 'Looks good — this platform is supported.'
        : 'Supported sources: YouTube, Kick, Dropbox, and Google Drive.';

    // Let the pipeline module know it should re-check the Create button.
    App.pipeline.updateCreateButtonState();
  }

  function init() {
    dom.urlInput.addEventListener('input', handleInput);
  }

  return { init, detectPlatform };
})();
