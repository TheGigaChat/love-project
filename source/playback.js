const scrollKeys = new Set([
  'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ',
]);

export function setUpPlayback({ start, control, status, soundtrack, openingPhoto }) {
  const startLabel = start.querySelector('[data-label]');
  const controlLabel = control.querySelector('[data-label]');
  const finePointer = window.matchMedia('(pointer: fine)');
  let playing = false;
  let frame = 0;
  let previousTime;
  let targetY;
  let expectedY;
  let touchStartY;

  function updateControls(label) {
    startLabel.textContent = label;
    controlLabel.textContent = label;
    start.dataset.playing = playing;
    control.dataset.playing = playing;
  }

  function pause(message = 'Просмотр приостановлен.') {
    if (!playing) return;

    playing = false;
    cancelAnimationFrame(frame);
    soundtrack.pause();
    updateControls('Продолжить');
    status.textContent = message;
  }

  function bottom() {
    const scroller = document.scrollingElement;
    return scroller.scrollHeight - scroller.clientHeight;
  }

  function hasManualOffset() {
    // A touch browser can report our own scroll after the read below.
    return finePointer.matches && Math.abs(window.scrollY - expectedY) > 1;
  }

  function advance(time) {
    if (hasManualOffset()) {
      pause();
      return;
    }

    const elapsed = Math.min(time - (previousTime ?? time), 50);
    const pixelsPerSecond = Math.min(105, Math.max(65, window.innerWidth * 0.11));
    const end = bottom();

    previousTime = time;
    targetY = Math.min(targetY + pixelsPerSecond * elapsed / 1000, end);
    window.scrollTo({ top: targetY, behavior: 'instant' });
    expectedY = window.scrollY;

    if (targetY >= end) {
      pause('Это конец предварительного просмотра.');
      return;
    }

    frame = requestAnimationFrame(advance);
  }

  function toggle() {
    if (playing) {
      pause();
      return;
    }

    if (window.scrollY >= bottom() - 1) {
      status.textContent = 'Пролистай немного назад, чтобы продолжить.';
      return;
    }

    playing = true;
    control.hidden = false;
    targetY = window.scrollY;
    expectedY = targetY;
    previousTime = undefined;
    soundtrack.volume = 0.45;
    soundtrack.play().catch(() => {
      if (playing) status.textContent = 'Просмотр продолжается. Музыка недоступна.';
    });
    updateControls('Пауза');
    status.textContent = 'Просмотр начался.';
    frame = requestAnimationFrame(advance);
  }

  start.addEventListener('click', toggle);
  control.addEventListener('click', toggle);

  openingPhoto.decode().catch(() => {
    // Keep the story available if the opening photo cannot load.
  }).then(() => {
    startLabel.textContent = 'Начать';
    start.disabled = false;
  });

  window.addEventListener('wheel', (event) => {
    if (event.deltaY && !event.ctrlKey) pause();
  }, { passive: true });

  window.addEventListener('touchstart', (event) => {
    touchStartY = event.touches.length === 1 ? event.touches[0].clientY : undefined;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (touchStartY === undefined || event.touches.length !== 1) return;

    if (Math.abs(event.touches[0].clientY - touchStartY) >= 8) pause();
  }, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || !scrollKeys.has(event.key)) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (event.key === ' ' && event.target.closest?.('button')) return;

    pause();
  });

  window.addEventListener('scroll', () => {
    // Catch native desktop scrolling, including scrollbar drags.
    if (playing && hasManualOffset()) pause();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
}
