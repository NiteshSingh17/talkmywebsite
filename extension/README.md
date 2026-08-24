# TalkMyWebsite - Free — Chrome Extension

> **Chat with pages ChatGPT can never reach** — your LinkedIn feed, Twitter timeline, banking dashboard, internal tools, or any site that requires you to be logged in.

---

## Why does this extension exist?

You can already paste a public URL into ChatGPT and ask it to browse that page. But that only works if ChatGPT's servers can visit the URL anonymously. It completely fails for:

| Situation | Why ChatGPT can't help without this extension |
|---|---|
| **Authenticated pages** | LinkedIn, Twitter/X, Gmail, Notion, Slack, banking — ChatGPT is not logged in as you |
| **Dynamic / personalised feeds** | Your social media feed is different every time it loads; the URL alone is meaningless |
| **Internal / private tools** | Company intranets, dashboards behind VPN, localhost apps |
| **Pages that block bots** | Many sites detect ChatGPT's crawler and return an error or empty page |
| **Pages that require interaction** | Infinite-scroll feeds, single-page apps that only render after JS runs |

TalkMyWebsite solves this by running entirely inside **your own browser** — where you are already logged in, your cookies are present, and JS has already rendered the page.

---

## How it works

```
Your Browser (logged in as you)
  │
  ├── Tab: LinkedIn / any site      ← you're authenticated here
  │
  └── Chrome Extension
        │
        ├── Reads the fully-rendered HTML of the active tab
        │   (your session, your data, your personalised feed)
        │
        ├── Sends that HTML to your local API (running on your machine)
        │
        └── Your local API exposes a temporary public URL via a tunnel
              │
              └──► ChatGPT fetches that URL ──► gets your private page content
                          │
                          └── ChatGPT sidebar opens alongside the page
                              (Alt+Shift+W) and already has the context
```

**The key insight:** ChatGPT never touches the real website. It fetches a temporary URL that your own machine serves — containing the already-rendered, already-authenticated HTML that your browser captured.

---

## Features

- **Works on any authenticated page** — LinkedIn, Twitter/X, Gmail, Notion, Slack, banking, internal tools, and more.
- **Live dynamic feeds** — Every message sends a fresh scrape of your current tab. Your personalised timeline, not a cached snapshot.
- **ChatGPT sidebar** — Press `Alt+Shift+W` to open ChatGPT side-by-side with any page. No tab switching.
- **Automatic context injection** — ChatGPT already knows what's on the page before you even type your question.
- **Page actions** — ChatGPT can instruct the extension to click buttons, scroll, or navigate on your behalf.
- **Incognito support** — Works across both normal and incognito windows.
- **100% free** — No subscription, no API key, uses your own ChatGPT account.

---

## Setup

### Prerequisites

- Node.js 18+
- The companion API running locally (see root `README.md`)
- A Cloudflare Tunnel or ngrok to expose the API publicly (so ChatGPT can fetch scrape URLs)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description | Example |
|---|---|---|
| `VITE_API_PUBLIC_URL` | The **public** HTTPS URL of your tunnel/API — ChatGPT fetches scrape links from here | `https://abc.trycloudflare.com` |
| `VITE_WS_URL` | Your **local** WebSocket URL — the extension connects here | `ws://localhost:3000/ws` |

> **Why two URLs?** The extension connects to your local API over WebSocket (fast, private). But the scrape links given to ChatGPT must be publicly reachable, so they use your tunnel URL.

### 3. Build

```bash
npm run build
```

Output lands in `dist_chrome/`.

### 4. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `dist_chrome/` folder
4. *(Optional)* To use with incognito tabs: click **Details** → enable **Allow in Incognito**

---

## Development

```bash
npm run dev
```

Watches `src/` and rebuilds `dist_chrome/` on every change. Reload the extension after each build.

---

## Icons

All icons live in `public/`:

| File | Size | Usage |
|---|---|---|
| `icon-16.png` | 16×16 | Favicon / tab strip |
| `icon-32.png` | 32×32 | Toolbar action (Windows HiDPI) |
| `icon-48.png` | 48×48 | Extensions management page |
| `icon-128.png` | 128×128 | Chrome Web Store listing |

---

## Project Structure

```
manifest.json            MV3 manifest (name, icons, permissions, side panel)
vite.config.base.ts      Shared Vite config
vite.config.chrome.ts    Chrome build target
public/                  Static assets & icons
src/background/          Service worker — sidebar open, tab watch, WS boot
src/chatgpt/             Content script — prefix injection, command interception
src/pages/popup/         Extension popup UI (copy scrape URL, connection status)
src/pages/sidepanel/     ChatGPT side panel UI
```

---

## Keyboard Shortcut

| Shortcut | Action |
|---|---|
| `Alt+Shift+W` | Open ChatGPT sidebar alongside the current tab |
