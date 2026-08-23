# Webchat

Bridge ChatGPT’s built-in browsing to pages open in **your** Chrome browser via a Chrome extension and NestJS API.

## Architecture

- **Extension** registers open tabs, serves stripped HTML, runs page commands (click, navigate, scroll).
- **API** exposes `GET /v1/scrape/{roomId}/{pageId}?t={secret}` and a WebSocket at `/ws` for the extension.
- **ChatGPT** (chatgpt.com only): Webchat bar, paste-to-temp-URL, command auto-reply.

## Quick start

### 1. API

```bash
cd api
npm install
npm run start:dev
```

Runs at `http://localhost:3000` — WebSocket `ws://localhost:3000/ws`.

### 2. Extension

```bash
cd extension
npm install
npm run dev:chrome
```

Load unpacked: `extension/dist_chrome` in `chrome://extensions`.

**Incognito:** There is no manifest permission for this — Chrome requires you to opt in manually. After loading the extension, open `chrome://extensions` → **Webchat** → **Details** → turn on **Allow in Incognito**. The manifest uses `"incognito": "spanning"` so one extension instance can bridge an incognito ChatGPT/Claude tab with tabs in normal windows. Reload the extension after changing the manifest.

Default API URL is `http://localhost:3000` (see `extension/.env.example`).

**Fresh scrapes:** Temp URLs include `?cb=<timestamp>`. Each new copy/paste gets a new `cb` so ChatGPT/Claude do not use a cached page. Re-scrape after commands by updating `cb` or copying the URL again.

### 3. Public HTTPS (for ChatGPT browsing)

ChatGPT’s server must reach your scrape URL. In development use a tunnel:

```bash
# Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000

# or ngrok
ngrok http 3000
```

Set `VITE_API_PUBLIC_URL` in `extension/.env` to the tunnel HTTPS origin, rebuild the extension.

**Important:** `VITE_WS_URL` must stay pointed at your **local** API (e.g. `ws://localhost:4000/ws`). Only the public scrape links use ngrok.

### Fixing 401 Unauthorized

ChatGPT means the API rejected the token. Common causes:

1. **Extension not connected** — popup must show green **Connected** before copying a URL.
2. **API restarted** — copy a **fresh** URL after reconnecting (secrets are now saved under `api/data/rooms-store.json`).
3. **Wrong port** — ngrok must forward to the same port the API runs on (`PORT=4000`) and `VITE_WS_URL` must match.
4. **Old URL format** — rebuild extension; new URLs put the token in the **path**:  
   `https://YOUR-TUNNEL/v1/scrape/{roomId}/{pageId}/{secret}`

Test your URL:

```bash
curl -sS "YOUR_FULL_SCRAPE_URL" | head -5
```

You should see HTML, not JSON/text about invalid token.

### Fixing ngrok / ChatGPT “timed out”

ChatGPT and ngrok often give up before 30 seconds. The API now uses a **12s** scrape limit and **never blocks** waiting for a popup during ChatGPT fetches.

1. **Verify tunnel → API (instant)**  
   ```bash
   curl -sS "https://YOUR-NGROK/v1/health"
   ```  
   Expect `{"ok":true,...}`. If this times out, ngrok is on the wrong port or API is not running.

2. **Same port everywhere**  
   ```bash
   PORT=4000 npm run start:dev   # api
   ngrok http 4000
   ```  
   Extension: `VITE_WS_URL=ws://localhost:4000/ws`

3. **Before ChatGPT browses**  
   - Popup: green **Connected**  
   - Target site tab **open**  
   - **Copy scrape URL** again (popup verifies the tab responds)

4. **Try Cloudflare Tunnel** if ngrok is flaky:  
   `cloudflared tunnel --url http://localhost:4000`

## Usage

1. Open any site (e.g. LinkedIn) in a tab.
2. Open **Webchat** popup → **Copy scrape URL** (or enable Webchat on ChatGPT and paste the normal URL).
3. On [chatgpt.com](https://chatgpt.com), click **Move to Webchat** for the onboarding prompt.
4. Toggle **Webchat ON** — pasted site URLs convert to temp scrape URLs automatically.
5. Ask ChatGPT to browse the temp URL and answer from the page.
6. If ChatGPT needs interaction, it replies with JSON:

```json
{
  "webchat": true,
  "pageId": "your-page-uuid",
  "command": { "action": "click", "selector": "button.primary" }
}
```

The extension auto-sends `{"webchat":true,"pageId":"...","success":true}` and ChatGPT can scrape again.

## Environment

| Variable | Where | Default |
|----------|--------|---------|
| `PORT` | API | `3000` |
| `SCRAPE_TIMEOUT_MS` | API | `30000` |
| `VITE_API_PUBLIC_URL` | Extension build | `http://localhost:3000` |
| `VITE_WS_URL` | Extension build | `ws://localhost:3000/ws` |

## Automated tests

```bash
# API must be running on :3000
cd api && npm run start:dev

# Another terminal
cd api && npm run test:e2e
cd api && npm run test:integration   # WS + scrape round-trip
```

## Test checklist

- [ ] Popup shows green “Connected”
- [ ] Copy scrape URL for active tab
- [ ] Move to Webchat sends onboarding once per chat
- [ ] Webchat ON: paste `https://example.com` → temp URL (with tab open)
- [ ] ChatGPT browses temp URL → HTML returned
- [ ] Command JSON → auto success reply
- [ ] Tab closed → scrape 424; popup offers Open tab

## Project layout

```
webchat/
  api/          NestJS scrape + WebSocket gateway
  extension/    Chrome extension (vite-web-extension)
```
