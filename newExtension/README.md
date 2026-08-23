# NewExtension

Fresh Chrome extension scaffold (Manifest V3) built with Vite + React + CRXJS + Tailwind.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Watches `src/` and rebuilds `dist_chrome/` on change. Load `dist_chrome/` as an unpacked extension via `chrome://extensions` → Developer mode → Load unpacked.

## Production build

```bash
npm run build
```

Output lands in `dist_chrome/`.

## Structure

```
manifest.json          MV3 skeleton (popup, side panel, minimal permissions)
vite.config.base.ts    shared Vite config
vite.config.chrome.ts  Chrome target
public/                static assets & icons
src/background/        service worker placeholder
src/pages/popup/       popup page
src/pages/sidepanel/   side panel page
```
