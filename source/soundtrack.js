const NORMAL_GAIN = 0.45;
const INTRO_FADE = 5;
const CHAPTER_FADE = 3;
const REWIND_FADE = 0.18;

function levelAt({ fade: { from, to, start, end } }, time) {
  if (time >= end) return to;

  return from + (to - from) * (time - start) / (end - start);
}

function fadeTo(track, level, time, duration) {
  const from = levelAt(track, time);
  const end = time + duration;

  track.gain.cancelScheduledValues(time);
  track.gain.setValueAtTime(from, time);
  track.gain.linearRampToValueAtTime(level, end);
  track.fade = { from, to: level, start: time, end };
  return end;
}

export function setUpSoundtrack({ start, control, elements, onUnavailable }) {
  let context;
  let tracks;
  let ready = false;
  let enabled = true;
  let selected = 0;
  let playing = -1;
  let revision = 0;

  async function waitForFade(end, request) {
    while (request === revision && context.currentTime < end) {
      const remaining = (end - context.currentTime) * 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.max(20, remaining)));
    }
  }

  async function prepareRewind(incoming, outgoing, request) {
    const now = context.currentTime;

    // On a quick reversal, keep the current song audible while rewinding the other.
    if (levelAt(incoming, now) > 0) {
      const end = fadeTo(incoming, 0, now, REWIND_FADE);
      fadeTo(outgoing, NORMAL_GAIN, now, REWIND_FADE);
      await waitForFade(end, request);
    }

    if (request !== revision) return false;
    incoming.element.pause();
    return true;
  }

  async function switchTrack() {
    const request = ++revision;
    const index = selected;
    const incoming = tracks[index];
    const outgoing = tracks[1 - index];

    try {
      if (index === playing) {
        await outgoing.primed;
        if (request === revision) await prepareRewind(outgoing, incoming, request);
        return;
      }

      await incoming.primed;
      if (request !== revision) return;

      if (playing !== -1 || incoming.element.paused) {
        if (!(await prepareRewind(incoming, outgoing, request))) return;
        if (request !== revision) return;
        incoming.element.currentTime = 0;
        await incoming.element.play();
        if (request !== revision) return;
      }

      const now = context.currentTime;
      const duration = playing === -1 ? INTRO_FADE : CHAPTER_FADE;
      playing = index;
      const end = fadeTo(incoming, NORMAL_GAIN, now, duration);
      fadeTo(outgoing, 0, now, duration);

      await outgoing.primed;
      await waitForFade(end, request);
      if (request === revision) outgoing.element.pause();
    } catch {
      if (request === revision) onUnavailable();
    }
  }

  function startSoundtrack() {
    const request = ++revision;

    try {
      context = new AudioContext();
      const resume = context.resume();

      // The Start tap authorizes both media elements before scroll-driven playback.
      tracks = elements.map((element, index) => {
        const channel = context.createGain();
        channel.gain.value = 0;
        context.createMediaElementSource(element).connect(channel);
        channel.connect(context.destination);

        const primed = element.play().then(() => {
          if (index !== selected) element.pause();
        }, () => {});

        return {
          element,
          gain: channel.gain,
          fade: { from: 0, to: 0, start: 0, end: 0 },
          primed,
        };
      });

      control.hidden = false;
      resume.then(() => {
        if (request !== revision) return;
        ready = true;
        void switchTrack();
      }, () => {
        if (request === revision) onUnavailable();
      });
    } catch {
      onUnavailable();
    }
  }

  function setEnabled(value) {
    enabled = value;
    control.textContent = enabled ? 'Выключить музыку' : 'Включить музыку';
  }

  async function toggleSoundtrack() {
    const request = ++revision;
    setEnabled(!enabled);

    if (!enabled) {
      ready = false;
      const now = context.currentTime;
      for (const track of tracks) {
        track.element.pause();
        track.gain.cancelScheduledValues(now);
        track.gain.setValueAtTime(0, now);
        track.fade = { from: 0, to: 0, start: now, end: now };
      }
      return;
    }

    const index = selected;
    const track = tracks[index];
    try {
      if (index !== playing) track.element.currentTime = 0;
      await Promise.all([context.resume(), track.element.play()]);
      if (request !== revision) return;

      playing = index;
      ready = true;
      fadeTo(track, NORMAL_GAIN, context.currentTime, REWIND_FADE);
      if (selected !== index) void switchTrack();
    } catch {
      if (request !== revision) return;
      track.element.pause();
      setEnabled(false);
      onUnavailable();
    }
  }

  start.addEventListener('click', startSoundtrack, { once: true });
  control.addEventListener('click', toggleSoundtrack);

  return {
    select(index) {
      if (index === selected) return;
      selected = index;
      if (ready) void switchTrack();
    },
  };
}
