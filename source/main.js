import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setUpPlayback } from './playback.js';
import { setUpSoundtrack } from './soundtrack.js';

gsap.registerPlugin(ScrollTrigger);

const start = document.querySelector('[data-start]');
const status = document.querySelector('[data-playback-status]');
const chapterTwo = document.querySelector('#month-two');

setUpPlayback({
  start,
  control: document.querySelector('[data-playback]'),
  status,
  openingPhoto: document.querySelector('[data-opening-photo]'),
});

const soundtrack = setUpSoundtrack({
  start,
  elements: [...document.querySelectorAll('[data-soundtrack]')],
  onUnavailable() {
    status.textContent = 'Не удалось включить музыку для этой главы.';
  },
});

function selectChapterSoundtrack(trigger) {
  soundtrack.select(trigger.scroll() >= trigger.start ? 1 : 0);
}

ScrollTrigger.create({
  trigger: chapterTwo,
  start: 'top center',
  end: 'max',
  onUpdate: selectChapterSoundtrack,
  onRefresh: selectChapterSoundtrack,
});

const motion = gsap.matchMedia();

motion.add('(prefers-reduced-motion: no-preference)', () => {
  const entrance = chapterTwo.querySelector('[data-chapter-entrance]');
  const photo = chapterTwo.querySelector('[data-chapter-photo]');

  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: chapterTwo,
      start: 'top 95%',
      end: 'top 12%',
      scrub: true,
    },
  })
    .fromTo(entrance, { clipPath: 'inset(8% 6% 0% 6% round 28px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)' })
    .fromTo(photo, { scale: 1.16 }, { scale: 1 }, '<');
});

const clip = document.querySelector('[data-memory-clip]');
let clipInView = false;

function loadClip() {
  if (clip.hasAttribute('src')) return;

  clip.poster = clip.dataset.poster;
  clip.preload = 'metadata';
  clip.src = clip.dataset.src;
}

function updateClip() {
  if (!clipInView || document.hidden) {
    clip.pause();
    return;
  }

  loadClip();
  clip.play().catch(() => {
    // When autoplay is denied, the poster remains visible.
  });
}

const preloadObserver = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;

  loadClip();
  preloadObserver.disconnect();
}, { rootMargin: '450px 0px' });

const visibilityObserver = new IntersectionObserver(([entry]) => {
  clipInView = entry.isIntersecting && entry.intersectionRatio >= 0.01;
  updateClip();
}, { threshold: 0.01 });

preloadObserver.observe(clip);
visibilityObserver.observe(clip);
document.addEventListener('visibilitychange', updateClip);
