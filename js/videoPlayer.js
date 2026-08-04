/* ============================================================
   VIDEO PLAYER
   Wires each generated clip's real, playable <video> element to the actual
   file the backend rendered (served from /files/<jobId>/<clipId>.mp4).

   - lazy-loads the source only once the card scrolls into view
     (IntersectionObserver) for performance
   - never marks a card "ready" until the video's data has actually
     loaded — no fake completed clips
   - surfaces a genuine error state (with retry) if the file fails to load
   - handles the real Download (fetch -> blob -> file save) and Share actions

   No demo/placeholder assets here — every URL comes straight from the
   clip object the backend returned in GET /api/status/<jobId>.
   ============================================================ */

App.videoPlayer = (function () {
  const { showToast } = App.utils;
  const { API_BASE_URL } = App.constants;

  let sharedObserver = null;

  function getObserver() {
    if (!sharedObserver) {
      sharedObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadVideo(entry.target);
              sharedObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '150px' }
      );
    }
    return sharedObserver;
  }

  function absoluteUrl(path) {
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  }

  function loadVideo(videoEl) {
    const clip = videoEl._clip;
    videoEl.src = absoluteUrl(clip.videoUrl);
    videoEl.preload = 'metadata';
    videoEl.load();
  }

  /** Attaches loading/error/playing state handling to one clip card's video. */
  function setupCard(thumbEl, videoEl, clip) {
    videoEl._clip = clip;
    videoEl.poster = absoluteUrl(clip.posterUrl);

    videoEl.addEventListener('loadeddata', () => {
      thumbEl.classList.add('is-ready');
      thumbEl.classList.remove('is-error');
    });

    videoEl.addEventListener('error', () => {
      thumbEl.classList.remove('is-ready');
      thumbEl.classList.add('is-error');
    });

    videoEl.addEventListener('play', () => thumbEl.classList.add('is-playing'));
    videoEl.addEventListener('pause', () => thumbEl.classList.remove('is-playing'));

    getObserver().observe(videoEl);
  }

  /** Retries loading after a genuine failure (called from the card's Retry button). */
  function retry(thumbEl, videoEl) {
    thumbEl.classList.remove('is-error');
    loadVideo(videoEl);
  }

  /** Real download: fetches the actual rendered video bytes and saves them under a clean filename. */
  async function downloadClip(clip) {
    try {
      showToast(`Preparing Clip ${clip.index} for download…`);
      const response = await fetch(absoluteUrl(clip.videoUrl));
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `ClipForge-Clip-${clip.index}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      showToast(`Clip ${clip.index} downloaded`);
    } catch (err) {
      showToast(`Couldn't download Clip ${clip.index} — ${err.message}`);
    }
  }

  async function shareClip(clip) {
    const shareUrl = absoluteUrl(clip.videoUrl);
    const shareData = {
      title: `ClipForge AI — Clip ${clip.index}`,
      text: 'Check out this clip I made with ClipForge AI',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled the native share sheet — nothing to do
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard');
    } else {
      showToast('Sharing is not supported on this browser');
    }
  }

  return { setupCard, retry, downloadClip, shareClip };
})();
