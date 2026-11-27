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

export { startButton, playbackButton, tracks, scrollPosition, playhead, placeMonthTwo };
