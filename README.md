# TalkMyWebsite - Free

> **Chat with pages ChatGPT can never reach** — your LinkedIn feed, Twitter/X timeline, Gmail, banking dashboard, internal tools, or any site that requires you to be logged in.

---

## The problem this solves

You can paste a public URL into ChatGPT and ask it to browse that page. But **ChatGPT's servers can't log in as you**. That means it completely fails for:

| Situation | Why it fails without TalkMyWebsite |
|---|---|
| **Authenticated pages** | LinkedIn, Twitter/X, Gmail, Notion, Slack, banking — ChatGPT is not logged in as you |
| **Dynamic / personalised feeds** | Your social media feed is unique to you and changes every refresh — a URL is meaningless to ChatGPT |
| **Internal / private tools** | Company intranets, dashboards behind VPN, localhost apps |
| **Pages that block bots** | Many sites detect ChatGPT's crawler and return an error or empty content |

TalkMyWebsite runs entirely inside **your own browser** — where you are already logged in — and serves the real page content to ChatGPT through a temporary private URL.

---

## How it works

```
Your Browser (logged in as you)
  │
  ├── Tab: LinkedIn / Twitter / Gmail / any private site
  │         ↑ your session & cookies are here
  │
  └── TalkMyWebsite Chrome Extension
        │
        ├── Reads the fully-rendered HTML from your active tab
        │   (authenticated, personalised, dynamic — exactly what you see)
        │
        ├── Sends it to the local API running on your machine
        │
        └── Local API creates a temporary public URL via your tunnel
              │
              └──► ChatGPT fetches that URL and gets your private page content
                          │
                          └── ChatGPT sidebar (Alt+Shift+W) is already open
                              beside your tab with full context injected
```

**ChatGPT never touches the real website.** It fetches a temporary URL your own machine generates — containing the already-rendered, already-authenticated HTML your browser captured for it.

---

## Architecture

| Component | Role |
|---|---|
| **Extension** (`newExtension/`) | Captures tab HTML, opens ChatGPT sidebar, injects page context into every message, executes AI page commands |
| **API** (`api/`) | NestJS server — manages rooms, serves scraped HTML at temp URLs, bridges extension ↔ ChatGPT via WebSocket |
| **Tunnel** (Cloudflare / ngrok) | Makes your local API reachable by ChatGPT's servers over public HTTPS |

---

## Quick Start

### 1. Start the API

```bash
cd api
npm install
npm run start:dev
```

Runs at `http://localhost:3000` — WebSocket at `ws://localhost:3000/ws`.

### 2. Expose it publicly (so ChatGPT can reach it)

ChatGPT's servers need to fetch your scrape URLs. Use a tunnel:

```bash
# Cloudflare Tunnel (recommended — no timeout issues, free)
cloudflared tunnel --url http://localhost:3000

# or ngrok
ngrok http 3000
```

Copy the HTTPS URL it gives you (e.g. `https://abc.trycloudflare.com`).

### 3. Build and load the extension

```bash
cd newExtension
cp .env.example .env
# Edit .env: set VITE_API_PUBLIC_URL to your tunnel HTTPS URL
npm install
npm run dev:chrome
```

Load unpacked in Chrome: `chrome://extensions` → **Developer mode** → **Load unpacked** → select `newExtension/dist_chrome/`.

**Incognito support:** After loading, open `chrome://extensions` → **TalkMyWebsite** → **Details** → turn on **Allow in Incognito**. The manifest uses `"incognito": "spanning"` so one instance bridges incognito and normal windows.

---

## Usage

1. Open any page in a tab — LinkedIn, your email, a private dashboard, anything.
2. Press **`Alt+Shift+W`** — ChatGPT opens as a sidebar beside the page.
3. ChatGPT automatically receives the current page content with every message you send.
4. Ask questions, summarise, extract data, or give instructions — ChatGPT has your full page context.

> **Example:** Open your LinkedIn feed → press `Alt+Shift+W` → ask *"Who posted something about hiring today?"* — ChatGPT reads your actual personalised feed and answers.

---

## Page Actions

If ChatGPT needs to interact with the page it replies with a command JSON:

```json
{
  "webchat": true,
  "pageId": "your-page-uuid",
  "command": { "action": "click", "selector": "button.primary" }
}
```

The extension executes it automatically and ChatGPT can scrape the result.

---

## Environment Variables

| Variable | Where | Default | Description |
|---|---|---|---|
| `PORT` | API | `3000` | API listen port |
| `SCRAPE_TIMEOUT_MS` | API | `30000` | Max time to wait for a scrape response |
| `VITE_API_PUBLIC_URL` | Extension build | `http://localhost:3000` | Public tunnel URL — ChatGPT fetches scrape links from here |
| `VITE_WS_URL` | Extension build | `ws://localhost:3000/ws` | Local WebSocket URL — extension connects here |

---

## Troubleshooting

### 401 Unauthorized from ChatGPT

1. Popup must show green **Connected** before copying a URL.
2. The API was restarted — copy a **fresh** URL after reconnecting.
3. Wrong port — your tunnel must point to the same port the API runs on.

### ChatGPT times out

1. Verify the tunnel is working: `curl https://YOUR-TUNNEL/v1/health` → should return `{"ok":true}`.
2. Make sure the target tab is open when ChatGPT fetches the scrape URL.
3. Switch from ngrok to Cloudflare Tunnel — ngrok's free tier has aggressive timeouts.

---

## Automated Tests

```bash
# Start API first
cd api && npm run start:dev

# In another terminal
cd api && npm run test:e2e
cd api && npm run test:integration
```

---

## Project Layout

```
webchat/
  api/              NestJS scrape API + WebSocket gateway
  newExtension/     TalkMyWebsite Chrome extension (Vite + MV3)
    public/         Static assets & icons (icon-16/32/48/128.png)
    src/background/ Service worker
    src/chatgpt/    ChatGPT content script
    src/pages/      Popup & side panel UI
```
