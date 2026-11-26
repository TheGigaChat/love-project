# Project plan

Build a public, static, phone-first memory story. The author will choose the material and write the story. The initial structure has twelve months and a closing section, with room for an opening.

## Stage 1 · Playback prototype

1. Scaffold Vite with plain HTML, CSS, and JavaScript. Keep the Vite entry page at the root and the app modules in source.
2. Build a cover, one complete placeholder chapter, and the entrance into a second chapter with a different visual style.
3. Add a Start button and a fixed Pause / Resume control. Start initiates music and auto-scroll. A swipe pauses automatic motion and leaves native scrolling available. Resume starts from the current position.
4. Use GSAP ScrollTrigger for reversible scene motion. Include one visual transition that works while scrolling in either direction.
5. Test on the intended phone. Check whether reading time, pause, scrolling back, and resuming feel natural. Consider an opt-in Watch mode only if accidental swipes are an issue.

## Scene video and media loading

- Treat Telegram video notes as optional until the author reviews the source clips. For the prototype, use a short placeholder MP4 displayed inline. A round clip can be cropped with CSS.
- Start the clip when its scene enters the viewport and pause it when the scene leaves. Use muted, inline playback for the first mobile test. If speech is part of a chosen clip, test audible playback from the opening Start interaction on the target phone before choosing how to present it. Retain the poster if playback is blocked.
- Prioritize the cover, initial typography, and the first scene's visible media. Start loading the next scene as it approaches and let later images and clips load as needed. Use fixed aspect ratios, placeholders, or posters so arriving media does not shift the scroll position.
- If the opening has a noticeable wait, show progress for the opening assets. Start is available once the first scene is ready.

## Stage 2 · Repeat for each month

1. Gather the month's text, photos, screenshots, clips, and audio. Select the memory that deserves the most time on screen.
2. Choose a visual direction that suits the material. Sketch the entrance, focal scene, and exit on portrait frames. Use Figma for composition, Photoshop for cutouts, and Resolve for clip editing as needed.
3. Keep text, media, and visual settings in the chapter's files. Give each month its own typography, layout, and motion. Reuse a shared effect when another chapter can use the same behavior.
4. Use AI to compare layout ideas or implement one motion change at a time. Try the result on a phone before developing the next effect.
5. Watch the chapter in order, then scroll back and resume from inside it. Review its handoff to the next month.

## Local testing and deployment

Use Vite on the same Wi-Fi network to test the prototype on a phone. Once a prototype is worth sharing across networks, deploy the static build. Vercel Hobby is the first option if the private repository belongs to a personal GitHub account. GitHub Pages on GitHub Free requires a public repository. Choose a host when the local prototype is ready to test remotely.

Only include media intended for the public site in the build. Keep raw exports and editing projects in separate working folders.
