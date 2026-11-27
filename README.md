# Love Project

A phone-first memory story in Russian, built with Vite and GSAP.

## Local development

Use Node.js 22.12 or later. In PowerShell, run:

```powershell
Set-Location 'C:\IT Folder\love-project'
npm ci
npm run dev
```

Run `npm ci` on first setup and after the lockfile changes. For everyday development, run `npm run dev` from the project folder. Open the **Local** URL Vite prints, usually `http://localhost:5173`. Vite updates the page as you edit. Press **Ctrl+C** to stop the server.

Edit the story copy in `index.html`, the styles and playback code in `source/`, and the site media in `public/media/`. Use Russian for visitor-facing text.

## Test on your iPhone

Start the development server with network access:

```powershell
npm run dev -- --host 0.0.0.0
```

Connect your computer and iPhone to the same Wi-Fi network, then open the **Network** URL Vite prints in Safari. Tap **Начать** to start the soundtrack and auto-scroll.

## Preview the production build

```powershell
npm run build
npm run preview
```

The build goes into `dist/`. To preview that build on your phone, use `npm run preview -- --host 0.0.0.0` and open its **Network** URL.

## Run the browser tests

Install the Playwright browser once, then run the tests:

```powershell
npx playwright install chromium --only-shell
npm test
```

The tests in `tests/` start a local Vite server automatically.
