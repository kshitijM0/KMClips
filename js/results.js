/* ============================================================
   RESULTS
   Renders the REAL clip list returned by the backend (GET
   /api/status/<jobId>, once stage === "done") as cards with real, playable
   <video> elements. No mock clip generation — pipeline.js hands this
   module the exact array the backend produced.
   ============================================================ */

App.results = (function () {
  const { dom, constants } = App;
  const { formatTime } = App.utils;

  function buildCardMarkup(clip) {
    const isSquare = clip.format === 'square';

    const titleBarHtml = isSquare
      ? `<div class="clip-title-bar">${clip.title || 'TITLE'}</div>`
      : '';

    return `
      <div class="clip-thumb${isSquare ? ' is-square' : ''}">
        ${titleBarHtml}
        <div class="clip-video-area">
          <span class="clip-timestamp-tag">${formatTime(clip.startSeconds)}–${formatTime(clip.endSeconds)}</span>
          <span class="clip-duration-tag">${clip.duration}s</span>
          <button class="clip-play-btn" aria-label="Clip ${clip.index} preview" tabindex="-1">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="#fff"/></svg>
          </button>
          <div class="clip-skeleton">
            <span class="skeleton-spinner"></span>
            Loading preview…
          </div>
          <div class="clip-error">
            <svg class="clip-error-icon" viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            <span>Preview failed to load</span>
            <button class="retry-btn" type="button">Retry</button>
          </div>
          <video preload="none" playsinline controls></video>
        </div>
      </div>
      <div class="clip-body">
        <div class="clip-title">Clip ${clip.index}</div>
        <div class="clip-meta">
          <span class="clip-meta-tag">${constants.CAPTION_STYLE_LABELS[clip.captionStyle] || clip.captionStyle}</span>
          <span class="clip-meta-tag">${clip.quality.toUpperCase()}</span>
          ${isSquare ? '<span class="clip-meta-tag">1:1 Square</span>' : ''}
        </div>
        <div class="clip-actions">
          <button class="clip-action-btn primary" data-action="download">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Download
          </button>
          <button class="clip-action-btn ghost" data-action="share">
            <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" stroke="currentColor" stroke-width="1.6"/></svg>
            Share
          </button>
        </div>
      </div>
    `;
  }

  /** Renders the real clip list from the backend. `clips` is exactly what
   * GET /api/status/<jobId> returned once stage === "done". */
  function renderClipCards(clips) {
    dom.clipGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    clips.forEach((clip, i) => {
      const card = document.createElement('article');
      card.className = 'clip-card';
      card.style.animationDelay = `${i * 0.08}s`;
      card.innerHTML = buildCardMarkup(clip);

      const thumb = card.querySelector('.clip-thumb');
      const videoEl = card.querySelector('video');
      App.videoPlayer.setupCard(thumb, videoEl, clip);

      card.querySelector('.retry-btn').addEventListener('click', () => {
        App.videoPlayer.retry(thumb, videoEl);
      });

      card.querySelector('[data-action="download"]').addEventListener('click', () => {
        App.videoPlayer.downloadClip(clip);
      });
      card.querySelector('[data-action="share"]').addEventListener('click', () => {
        App.videoPlayer.shareClip(clip);
      });

      fragment.appendChild(card);
    });

    // Single DOM write for the whole grid — avoids layout thrashing from
    // appending cards one at a time.
    dom.clipGrid.appendChild(fragment);
  }

  return { renderClipCards };
})();
