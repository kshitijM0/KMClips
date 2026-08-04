/* ============================================================
   PIPELINE
   Screen navigation between Configure -> Processing -> Results, Create-
   button validation, and talking to the REAL backend (see /backend) that
   downloads the video, detects highlights, transcribes captions, and
   renders the clips.

   No simulated/mock timers here — every stage shown on the Processing
   screen reflects the backend's actual current stage, polled from
   GET /api/status/<jobId>. If the backend isn't running, job creation
   fails with a clear error toast instead of silently faking progress.
   ============================================================ */

App.pipeline = (function () {
  const { dom, state, constants } = App;
  const { wait, showToast, formatTime } = App.utils;

  const POLL_INTERVAL_MS = 800;

  function updateCreateButtonState() {
    const ready = state.videoUrl.trim().length > 0;
    dom.createBtn.disabled = !ready;
  }

  function goToScreen(name) {
    Object.entries(dom.screens).forEach(([key, section]) => {
      section.classList.toggle('active', key === name);
    });

    const order = ['create', 'processing', 'results'];
    const activeIndex = order.indexOf(name);
    dom.stepTrack.querySelectorAll('.step').forEach((step, i) => {
      step.classList.toggle('is-active', i === activeIndex);
      step.classList.toggle('is-done', i < activeIndex);
    });
  }

  function resetProcessingUI() {
    dom.progressBarFill.style.width = '0%';
    dom.ringProgress.style.strokeDashoffset = constants.RING_CIRCUMFERENCE;
    dom.ringPercent.textContent = '0%';
    dom.etaValue.textContent = '--';
    dom.stageList.querySelectorAll('.stage').forEach((stage) => {
      stage.classList.remove('is-active', 'is-done');
    });
  }

  function resetToCreateScreen() {
    goToScreen('create');
    resetProcessingUI();
  }

  function setStageStatus(stageKey, status) {
    const stageEl = dom.stageList.querySelector(`[data-stage="${stageKey}"]`);
    if (!stageEl) return;
    stageEl.classList.remove('is-active', 'is-done');
    if (status === 'active') stageEl.classList.add('is-active');
    if (status === 'done') stageEl.classList.add('is-done');
  }

  /** Cumulative progress-bar % once `stageKey` has been REPORTED BY THE BACKEND. */
  function cumulativeWeightFor(stageKey) {
    let sum = 0;
    for (const stage of constants.PIPELINE_STAGES) {
      sum += stage.weight;
      if (stage.key === stageKey) break;
    }
    return sum * 100;
  }

  /** Smoothly animates the progress bar/ring from its current % to `targetPercent`. */
  function animateProgressTo(targetPercent) {
    return new Promise((resolve) => {
      const startPercent = parseFloat(dom.progressBarFill.style.width) || 0;
      const start = performance.now();
      const animDuration = 350;

      function frame(now) {
        const t = Math.min((now - start) / animDuration, 1);
        const percent = startPercent + (targetPercent - startPercent) * t;
        dom.progressBarFill.style.width = `${percent}%`;
        dom.ringPercent.textContent = `${Math.round(percent)}%`;
        dom.ringProgress.style.strokeDashoffset =
          constants.RING_CIRCUMFERENCE * (1 - percent / 100);
        if (t < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  /** Marks every stage up to and including `stageKey` as done, and the next one active. */
  function applyStageToUI(stageKey) {
    const keys = constants.PIPELINE_STAGES.map((s) => s.key);
    const idx = keys.indexOf(stageKey);
    if (idx === -1) return; // 'queued' or other non-UI stage
    keys.forEach((k, i) => {
      if (i < idx) setStageStatus(k, 'done');
      else if (i === idx) setStageStatus(k, 'active');
      else setStageStatus(k, 'pending');
    });
  }

  /** Honest ETA: average time-per-completed-stage so far * stages remaining. */
  function updateEta(stageKey, jobStartedAt, completedStages) {
    const keys = constants.PIPELINE_STAGES.map((s) => s.key);
    const idx = keys.indexOf(stageKey);
    if (idx <= 0 || completedStages === 0) {
      dom.etaValue.textContent = 'Calculating…';
      return;
    }
    const elapsedMs = performance.now() - jobStartedAt;
    const avgPerStage = elapsedMs / completedStages;
    const remainingStages = keys.length - idx;
    const remainingMs = avgPerStage * remainingStages;
    dom.etaValue.textContent = formatTime(Math.max(Math.round(remainingMs / 1000), 1));
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    let body = null;
    try { body = await response.json(); } catch (e) { /* no body */ }
    if (!response.ok) {
      const message = (body && body.error) || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return body;
  }

  /** POST /api/create-clips — kicks off the real backend job. */
  async function createClipsJob() {
    return fetchJson(`${constants.API_BASE_URL}/api/create-clips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: state.videoUrl,
        duration: state.duration,
        clipCount: state.clipCount,
        captionStyle: state.captionStyle,
        quality: state.quality,
        titleMode: state.titleMode,
        generatedTitle: state.generatedTitle,
      }),
    });
  }

  /** GET /api/status/<jobId> */
  async function fetchJobStatus(jobId) {
    return fetchJson(`${constants.API_BASE_URL}/api/status/${jobId}`);
  }

  async function runPipeline() {
    const jobStartedAt = performance.now();
    let completedStages = 0;
    let lastStageKey = null;
    let consecutivePollFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 4; // tolerate brief network hiccups before giving up

    let job;
    try {
      job = await createClipsJob();
    } catch (err) {
      showToast(`Couldn't start the job: ${err.message}`);
      resetToCreateScreen();
      return;
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let status;
      try {
        status = await fetchJobStatus(job.jobId);
        consecutivePollFailures = 0;
      } catch (err) {
        consecutivePollFailures += 1;
        if (consecutivePollFailures >= MAX_CONSECUTIVE_FAILURES) {
          showToast(`Lost connection to the backend: ${err.message}`);
          resetToCreateScreen();
          return;
        }
        // Transient hiccup — wait and try again rather than aborting a job
        // that may still be running fine on the backend.
        await wait(POLL_INTERVAL_MS);
        continue;
      }

      if (status.stage !== lastStageKey && status.stage !== 'queued') {
        if (lastStageKey !== null) completedStages += 1;
        lastStageKey = status.stage;
        applyStageToUI(status.stage === 'done' ? 'finalize' : status.stage);
        await animateProgressTo(
          status.stage === 'done' ? 100 : cumulativeWeightFor(status.stage)
        );
        updateEta(status.stage, jobStartedAt, completedStages);
      }

      if (status.stage === 'done') {
        constants.PIPELINE_STAGES.forEach((s) => setStageStatus(s.key, 'done'));
        dom.ringPercent.textContent = '100%';
        await wait(400); // brief pause so "finalizing -> done" is visible
        App.results.renderClipCards(status.clips);
        goToScreen('results');
        return;
      }

      if (status.stage === 'error') {
        showToast(`Clip generation failed: ${status.error || 'unknown error'}`);
        resetToCreateScreen();
        return;
      }

      await wait(POLL_INTERVAL_MS);
    }
  }

  function startClipGeneration() {
    resetProcessingUI();
    goToScreen('processing');
    runPipeline();
  }

  function init() {
    App.utils.attachRipple(dom.createBtn);
    dom.createBtn.addEventListener('click', () => {
      if (dom.createBtn.disabled) return;
      startClipGeneration();
    });

    App.utils.attachRipple(dom.createMoreBtn);
    dom.createMoreBtn.addEventListener('click', resetToCreateScreen);

    updateCreateButtonState();
  }

  return { init, updateCreateButtonState, goToScreen };
})();
