# Love Project

This is a phone-first, static memory story. The author supplies the writing, photos, screenshots, video, voice messages, and music. Use placeholders for layout and playback experiments until the author chooses the material.

- Read [the project plan](docs/plan.md) before changing the chapter structure, playback, or media loading.
- Consult the [visual references](docs/references/visual.md) and [technical references](docs/references/technical.md) when designing a chapter or implementing an effect.
- Keep planning and chapter briefs in docs, application code in source, and deployable static media in public.
- Use Vite, plain HTML, CSS, JavaScript, and GSAP ScrollTrigger for the first prototype.
- The story has twelve monthly chapters followed by a closing section, with room for an opening. Give each month its own type, composition, and motion. Keep the playback controls easy to recognize across chapters.
- Use the current scroll position as the source of truth for visual progress. A manual swipe pauses autoplay. Resume continues from the current position.
- When a chapter has an inline video, trigger it from scene entry and pause it on exit. Test muted playback on mobile and treat spoken audio as a separate behavior to verify.
- Prioritize the opening and the first scene. Load later media as it approaches and reserve media dimensions up front.
- Review motion changes at phone size and check forward scroll, backward scroll, pause, and resume. Keep raw exports and editing projects outside the published files.

## Language and typography

- Collaborate with the author in English. Write all visitor-facing copy in Russian, including chapter text, controls, status messages, and accessibility labels.
- Choose typefaces with Cyrillic glyphs and check Russian text at phone widths. Serve fonts and their licenses locally.
- Use WebP for optimized photos and posters. When JPEG or PNG is needed for the site, name the optimized copy with a `-web` suffix before the extension.
