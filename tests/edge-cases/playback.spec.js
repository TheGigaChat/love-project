import { expect, test } from '@playwright/test';
import { startButton, playbackButton, tracks, scrollPosition, playhead, placeMonthTwo } from '../helpers.js';

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

test('scrolling back through the exact music boundary restores the first track', async ({ page }) => {
  await page.goto('/');
  await startButton(page).tap();
  await playbackButton(page).tap();
  await page.evaluate(() => document.fonts.ready);
  const boundary = await page.locator('#month-two').evaluate((chapter) =>
    Math.round(chapter.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2),
  );
  const first = tracks(page).nth(0);
  const second = tracks(page).nth(1);
  const moveTo = (position) => page.evaluate(async (y) => {
    window.scrollTo(0, y);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return window.scrollY;
  }, position);

  await moveTo(boundary + 20);
  await expect(first).toHaveJSProperty('paused', true);
  await expect(second).toHaveJSProperty('paused', false);

  // A slow return can land exactly at the start before moving outside the trigger.
  expect(await moveTo(boundary)).toBe(boundary);
  expect(await moveTo(boundary - 1)).toBe(boundary - 1);
  await expect(first).toHaveJSProperty('paused', false);
  await expect(second).toHaveJSProperty('paused', true);
});
