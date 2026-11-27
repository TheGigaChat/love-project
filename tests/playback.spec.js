import { expect, test } from '@playwright/test';

const startButton = (page) => page.getByRole('button', { name: 'Начать', exact: true });
const playbackButton = (page) => page.locator('[data-playback]');
const tracks = (page) => page.locator('[data-soundtrack]');
const scrollPosition = (page) => page.evaluate(() => window.scrollY);
const playhead = (track) => track.evaluate((element) => element.currentTime);

async function placeMonthTwo(page, viewportFraction) {
  await page.locator('#month-two').evaluate((chapter, fraction) => {
    const top = chapter.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - window.innerHeight * fraction);
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, viewportFraction);
}

async function swipe(page, from, to) {
  const session = await page.context().newCDPSession(page);
  const touchPoints = (y) => [{ x: 120, y }];
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touchPoints(from) });
    for (let step = 1; step <= 8; step += 1) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: touchPoints(from + (to - from) * step / 8),
      });
      await page.waitForTimeout(25);
    }
    // Release after a brief hold so momentum does not affect the next action.
    await page.waitForTimeout(100);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

test('Start, Pause and Resume work with swipes in either direction', async ({ page }) => {
  await page.goto('/');
  const playback = playbackButton(page);
  const music = tracks(page).first();
  await expect(playback).toBeHidden();
  await expect(music).toHaveJSProperty('paused', true);

  await startButton(page).tap();
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(20);
  await expect(music).toHaveJSProperty('paused', false);
  await playback.tap();
  await expect(playback).toHaveText('Продолжить');
  const pausedAt = await scrollPosition(page);
  const audioAt = await playhead(music);
  await expect.poll(() => playhead(music)).toBeGreaterThan(audioAt + 0.15);
  expect(await scrollPosition(page)).toBe(pausedAt);

  await playback.tap();
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(pausedAt + 10);
  await swipe(page, 620, 370);
  await expect(playback).toHaveText('Продолжить');
  const afterForwardSwipe = await scrollPosition(page);
  expect(afterForwardSwipe).toBeGreaterThan(pausedAt + 100);

  await playback.tap();
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(afterForwardSwipe + 10);
  await swipe(page, 320, 520);
  await expect(playback).toHaveText('Продолжить');
  expect(await scrollPosition(page)).toBeLessThan(afterForwardSwipe - 60);
  await expect(music).toHaveJSProperty('paused', false);
});

test('late scroll updates do not pause touch playback', async ({ page }) => {
  await page.addInitScript(() => {
    const scrollTo = window.scrollTo.bind(window);
    window.scrollTo = (...args) => {
      if (args[0]?.behavior === 'instant') {
        setTimeout(() => scrollTo(...args), 45);
      } else {
        scrollTo(...args);
      }
    };
  });

  await page.goto('/');
  await startButton(page).tap();
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(30);
  await expect(playbackButton(page)).toHaveText('Пауза');
});

test('the muted inline clip plays only while in view', async ({ page }) => {
  await page.goto('/');
  const clip = page.locator('video');
  await expect(clip).toHaveJSProperty('muted', true);
  await expect(clip).toHaveJSProperty('playsInline', true);
  await expect(clip).toHaveJSProperty('paused', true);

  await clip.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect.poll(() => playhead(clip)).toBeGreaterThan(0.1);
  await placeMonthTwo(page, 0);
  await expect(clip).toHaveJSProperty('paused', true);

  await clip.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect(clip).toHaveJSProperty('paused', false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(clip).toHaveJSProperty('paused', true);
});

test('the visual entrance follows scroll in both directions', async ({ page }) => {
  await page.goto('/');
  const entrance = page.locator('[data-chapter-entrance]');
  const clipPath = () => entrance.evaluate((element) => getComputedStyle(element).clipPath);

  await placeMonthTwo(page, 0.85);
  const entrancePath = await clipPath();
  await placeMonthTwo(page, 0.45);
  await expect.poll(clipPath).not.toBe(entrancePath);
  const halfwayPath = await clipPath();
  await placeMonthTwo(page, 0);
  await expect.poll(clipPath).toBe('inset(0%)');

  await placeMonthTwo(page, 0.45);
  await expect.poll(clipPath).toBe(halfwayPath);
  await placeMonthTwo(page, 0.85);
  await expect.poll(clipPath).toBe(entrancePath);
});

test('the soundtrack fades in and crossfades with the chapter', async ({ page }) => {
  await page.addInitScript(() => {
    const fadeStarts = new WeakMap();
    const setValue = AudioParam.prototype.setValueAtTime;
    const ramp = AudioParam.prototype.linearRampToValueAtTime;
    window.fadeDurations = [];
    AudioParam.prototype.setValueAtTime = function (value, time) {
      fadeStarts.set(this, time);
      return setValue.call(this, value, time);
    };
    AudioParam.prototype.linearRampToValueAtTime = function (value, time) {
      if (value > 0) window.fadeDurations.push(Math.round((time - fadeStarts.get(this)) * 1000));
      return ramp.call(this, value, time);
    };
  });
  await page.goto('/');
  const first = tracks(page).nth(0);
  const second = tracks(page).nth(1);
  const fades = () => page.evaluate(() => window.fadeDurations);
  await expect(first).toHaveJSProperty('paused', true);
  await expect(second).toHaveJSProperty('paused', true);

  await startButton(page).tap();
  await expect.poll(fades).toContain(5000);
  await expect(second).toHaveJSProperty('paused', true);
  await playbackButton(page).tap();

  await placeMonthTwo(page, 0.25);
  await expect.poll(fades).toContain(3000);
  await expect(first).toHaveJSProperty('paused', false);
  await expect(second).toHaveJSProperty('paused', false);
  await expect(first).toHaveJSProperty('paused', true);
  const firstPlayhead = await playhead(first);
  expect(firstPlayhead).toBeGreaterThan(2);

  await placeMonthTwo(page, 0.75);
  await expect(first).toHaveJSProperty('paused', false);
  expect(await playhead(first)).toBeLessThan(firstPlayhead - 1);
  await expect(second).toHaveJSProperty('paused', true);
});

test('the fixed music button toggles the current chapter soundtrack', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await page.goto('/');
  const musicToggle = page.locator('[data-music-toggle]');
  const playback = playbackButton(page);
  const first = tracks(page).nth(0);
  const second = tracks(page).nth(1);
  await expect(musicToggle).toBeHidden();
  await startButton(page).tap();
  await expect(musicToggle).toHaveText('Выключить музыку');
  await expect(first).toHaveJSProperty('paused', false);
  await expect(second).toHaveJSProperty('paused', true);
  await playback.tap();
  const [stopBox, playbackBox] = await Promise.all([musicToggle.boundingBox(), playback.boundingBox()]);
  expect(stopBox.x).toBeGreaterThanOrEqual(0);
  expect(stopBox.y).toBe(playbackBox.y);
  expect(stopBox.x + stopBox.width).toBeLessThan(playbackBox.x);

  await placeMonthTwo(page, 0.25);
  await expect(second).toHaveJSProperty('paused', false);
  await expect(first).toHaveJSProperty('paused', false);
  await musicToggle.tap();
  await expect(musicToggle).toHaveText('Включить музыку');
  await expect(first).toHaveJSProperty('paused', true);
  await expect(second).toHaveJSProperty('paused', true);

  const beforeResume = await scrollPosition(page);
  await playback.tap();
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(beforeResume + 12);
  await expect(first).toHaveJSProperty('paused', true);
  await expect(second).toHaveJSProperty('paused', true);

  await playback.tap();
  await placeMonthTwo(page, 0.75);
  await musicToggle.tap();
  await expect(musicToggle).toHaveText('Выключить музыку');
  await expect.poll(() => playhead(first)).toBeGreaterThan(0.2);
  await expect(second).toHaveJSProperty('paused', true);
  await expect(playback).toHaveText('Продолжить');

  await musicToggle.tap();
  const stoppedAt = await playhead(first);
  await expect(first).toHaveJSProperty('paused', true);
  await musicToggle.tap();
  await expect.poll(() => playhead(first)).toBeGreaterThan(stoppedAt + 0.1);
});
