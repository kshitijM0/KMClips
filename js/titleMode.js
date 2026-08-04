/* ============================================================
   TITLE MODE
   Handles the Title Mode toggle (switches output to 1:1 square), the Title
   Tone dropdown, the Emoji toggle, and the placeholder "AI" title
   generator. Swap generateTitle() for a real LLM/API call when a backend
   is available — the surrounding UI wiring does not need to change.
   ============================================================ */

App.titleMode = (function () {
  const { dom, state } = App;
  const { toggleSwitch, randomChoice } = App.utils;

  // Template pools per tone. A real implementation would replace
  // generateTitle() with a call to a text-generation API that also takes
  // the clip's transcript/topic into account.
  const TITLE_TEMPLATES = {
    funny: [
      "When bro thinks he's the main character",
      "This shouldn't be this funny",
      "Nobody was ready for this",
      "POV: you did NOT see that coming",
      'The way he just did that',
    ],
    informative: [
      "3 Things You Didn't Notice",
      "Here's What Actually Happened",
      'The Detail Everyone Missed',
      'What This Really Means',
      'Breaking This Down In 30 Seconds',
    ],
    clickbait: [
      "You Won't Believe What Happens Next",
      'Wait For The Ending...',
      'This Went Way Too Far',
      'Nobody Expected THIS',
      "The Internet Can't Stop Talking About This",
    ],
    motivational: [
      'Never Give Up.',
      'This Is Your Sign',
      "Keep Going, You're Closer Than You Think",
      'Discipline Beats Motivation',
      'Small Steps Still Count',
    ],
    educational: [
      'Here\'s How It Actually Works',
      'The Science Behind This',
      'What Most People Get Wrong',
      'A Simple Way To Understand This',
      'Explained In Under A Minute',
    ],
    storytelling: [
      'This Changed Everything',
      'It Started With One Decision',
      'Nobody Saw This Coming',
      'The Story Behind The Moment',
      'Every Story Matters',
    ],
    sarcastic: [
      "Oh, Totally Didn't See That Coming",
      'Sure, That Makes Sense',
      'Yeah, This Is Fine',
      'Because Of Course It Happened',
      'Wow. Just Wow.',
    ],
    emotional: [
      'This Hit Different',
      "I Wasn't Ready For This",
      'This Made Everyone Emotional',
      'A Moment That Says Everything',
      'This Stayed With Me',
    ],
  };

  const EMOJI_POOLS = {
    funny: ['😂', '💀', '🤣', '😭'],
    informative: ['🧠', '📌', '🔍'],
    clickbait: ['😳', '🤯', '👀'],
    motivational: ['🔥', '💪', '⚡'],
    educational: ['📚', '✅', '🧠'],
    storytelling: ['🎬', '✨', '📖'],
    sarcastic: ['🙄', '😏', '💀'],
    emotional: ['🥹', '❤️', '😢'],
  };

  /** PLACEHOLDER: replace with a real AI title-generation API call. */
  function generateTitle(tone, emojiEnabled) {
    const base = randomChoice(TITLE_TEMPLATES[tone] || TITLE_TEMPLATES.funny);
    const emoji = emojiEnabled ? ` ${randomChoice(EMOJI_POOLS[tone] || EMOJI_POOLS.funny)}` : '';
    return `"${base}${emoji}"`;
  }

  function refreshGeneratedTitle() {
    state.generatedTitle = generateTitle(state.titleTone, state.emojiEnabled);
    dom.generatedTitleEl.textContent = state.generatedTitle;
    App.preview.refresh();
  }

  function setPanelOpen(isOpen) {
    dom.titleModePanel.classList.toggle('is-open', isOpen);
    dom.titleModeHint.textContent = isOpen
      ? 'Output becomes a 1:1 square with a title bar above the video.'
      : 'Output stays vertical (9:16) with captions only.';
  }

  function handleToggleClick() {
    state.titleMode = toggleSwitch(dom.titleModeToggle);
    setPanelOpen(state.titleMode);
    if (state.titleMode && !state.generatedTitle) {
      refreshGeneratedTitle();
    }
    App.preview.refresh();
  }

  function handleToneChange() {
    state.titleTone = dom.titleToneSelect.value;
    refreshGeneratedTitle();
  }

  function handleEmojiToggle() {
    state.emojiEnabled = App.utils.toggleSwitch(dom.emojiToggle);
    dom.emojiState.textContent = state.emojiEnabled ? 'Enabled' : 'Disabled';
    refreshGeneratedTitle();
  }

  function init() {
    dom.titleModeToggle.addEventListener('click', handleToggleClick);
    dom.titleToneSelect.addEventListener('change', handleToneChange);
    dom.emojiToggle.addEventListener('click', handleEmojiToggle);
    dom.regenerateTitleBtn.addEventListener('click', refreshGeneratedTitle);
    App.utils.attachRipple(dom.regenerateTitleBtn);

    // Seed an initial title so the panel never looks empty once opened
    state.generatedTitle = generateTitle(state.titleTone, state.emojiEnabled);
    dom.generatedTitleEl.textContent = state.generatedTitle;
  }

  return { init };
})();
