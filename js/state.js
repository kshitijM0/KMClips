/* ============================================================
   STATE
   Single source of truth for the current job configuration, cached DOM
   references, and shared constants. Every other module reads/writes
   `App.state` and looks up elements through `App.dom` instead of
   re-querying the document, which keeps DOM access in one place and
   avoids duplicated lookups.
   ============================================================ */

App.state = {
  videoUrl: '',
  sourcePlatform: null,     // 'youtube' | 'kick' | 'dropbox' | 'gdrive-file' | 'gdrive-folder' | null

  duration: 30,             // seconds, 10-50
  captionStyle: 'mrbeast',  // mrbeast | wordbyword | clean | gaming | cinema | glow

  titleMode: false,
  titleTone: 'funny',
  emojiEnabled: true,
  titleFont: 'Poppins',
  captionFont: 'Inter',
  generatedTitle: '',

  quality: '1080p',
  clipCount: 2,

  clips: [],                // populated once App.pipeline.runPipeline() gets clips back from the backend
};

App.dom = {
  // Video URL
  urlInput: document.getElementById('videoUrl'),
  urlHint: document.getElementById('urlHint'),
  detectedChip: document.getElementById('detectedChip'),
  platformBadges: document.getElementById('platformBadges'),

  // Duration
  durationSlider: document.getElementById('durationSlider'),
  durationValue: document.getElementById('durationValue'),
  revealGroup: document.getElementById('revealGroup'),

  // Caption style
  captionGrid: document.getElementById('captionGrid'),

  // Title Mode
  titleModeToggle: document.getElementById('titleModeToggle'),
  titleModeHint: document.getElementById('titleModeHint'),
  titleModePanel: document.getElementById('titleModePanel'),
  titleToneSelect: document.getElementById('titleToneSelect'),
  emojiToggle: document.getElementById('emojiToggle'),
  emojiState: document.getElementById('emojiState'),
  generatedTitleEl: document.getElementById('generatedTitle'),
  regenerateTitleBtn: document.getElementById('regenerateTitleBtn'),

  // Live preview
  phoneMock: document.getElementById('phoneMock'),
  phoneMockTitleBar: document.getElementById('phoneMockTitleBar'),
  phoneMockCaption: document.getElementById('phoneMockCaption'),
  phoneMockCaptionText: document.getElementById('phoneMockCaptionText'),
  previewDurationTag: document.getElementById('previewDurationTag'),
  previewQualityTag: document.getElementById('previewQualityTag'),
  previewClipsTag: document.getElementById('previewClipsTag'),
  previewFormatTag: document.getElementById('previewFormatTag'),
  titleFontSelect: document.getElementById('titleFontSelect'),
  captionFontSelect: document.getElementById('captionFontSelect'),

  // Output settings
  qualitySelect: document.getElementById('qualitySelect'),
  clipsSelect: document.getElementById('clipsSelect'),

  // Create button
  createBtn: document.getElementById('createBtn'),
  createMoreBtn: document.getElementById('createMoreBtn'),

  // Screens + step indicator
  screens: {
    create: document.getElementById('screen-create'),
    processing: document.getElementById('screen-processing'),
    results: document.getElementById('screen-results'),
  },
  stepTrack: document.getElementById('stepTrack'),

  // Processing screen
  ringProgress: document.getElementById('ringProgress'),
  ringPercent: document.getElementById('ringPercent'),
  etaValue: document.getElementById('etaValue'),
  progressBarFill: document.getElementById('progressBarFill'),
  stageList: document.getElementById('stageList'),

  // Results screen
  clipGrid: document.getElementById('clipGrid'),
};

App.constants = {
  // Where the Python backend (see /backend in this delivery) is running.
  // Change this if you deploy the backend somewhere other than your own
  // machine.
  API_BASE_URL: 'http://localhost:5000',

  CAPTION_STYLE_LABELS: {
    mrbeast: 'MrBeast Style',
    wordbyword: 'Word By Word',
    clean: 'Modern Clean',
    gaming: 'Gaming Style',
    cinema: 'Cinema Style',
    glow: 'Glow Style',
  },

  // Processing pipeline stages, in the order they run. `weight` controls how
  // much of the overall progress bar each stage consumes.
  // `weight` is how much of the progress bar each stage fills once the
  // backend reports that stage — used purely for a smooth visual fill
  // between real stage-change events, not for timing anything.
  PIPELINE_STAGES: [
    { key: 'download', label: 'Downloading video', weight: 0.18 },
    { key: 'detect', label: 'Detecting best moments', weight: 0.22 },
    { key: 'captions', label: 'Generating AI captions', weight: 0.24 },
    { key: 'render', label: 'Rendering clips', weight: 0.28 },
    { key: 'finalize', label: 'Finalizing export', weight: 0.08 },
  ],

  RING_CIRCUMFERENCE: 2 * Math.PI * 34, // matches r="34" on the processing ring SVG
};
