# TalkMyWebsite — API

The NestJS backend that powers TalkMyWebsite. It receives live HTML from the Chrome extension over WebSocket, exposes secure scrape endpoints for ChatGPT to fetch, and manages room/session state.

## Architecture

```
newExtension (Chrome)
      │  WebSocket (ws://localhost:3000/ws)
      ▼
ExtensionGateway  ──registers──▶  RoomsService  ──stores──▶  rooms-store.json
                                       │
                              waits for HTML request
                                       │
     ChatGPT server  ──GET──▶  ScrapeController
                                       │
                              requestHtml() over WS
                                       │
                              Extension scrapes tab
                                       │
                              returns HTML to ChatGPT
```

## Endpoints

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/health` | Returns `{"ok":true}` — use this to verify the API and tunnel are reachable |

### Scrape

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/scrape/:roomId/:pageId/:secret` | Fetch live HTML for a registered page |
| `GET` | `/v1/scrape/:roomId/:pageId/:secret/b/:cacheBust` | Same, with path-based cache-busting (preferred — survives CDN/proxy caches) |

Both endpoints accept an optional `?sidebar=true` query parameter when the request originates from the ChatGPT sidebar.

**Response codes:**

| Status | Meaning |
|---|---|
| `200` | HTML body of the live page |
| `401` | Missing or invalid access token |
| `424` | Page not open in the browser |
| `503` | Extension offline |
| `504` | Scrape timed out (default 12 s) |

### WebSocket (`/ws`)

The extension opens a persistent WebSocket connection on startup.

**Extension → API messages:**

```jsonc
// Register the extension session
{ "type": "register", "roomId": "uuid", "roomSecret": "uuid" }

// Respond with scraped HTML
{ "type": "html", "pageId": "uuid", "html": "<html>…</html>" }

// Report a page-not-open error
{ "type": "html", "pageId": "uuid", "html": "<!-- WEBCHAT_PAGE_NOT_OPEN -->" }
```

**API → Extension messages:**

```jsonc
// Request fresh HTML from a tab
{ "type": "scrape", "pageId": "uuid", "clientBust": "1234567890", "fromSidebar": false }
```

## Setup

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the API listens on | `3000` |
| `SCRAPE_TIMEOUT_MS` | Max ms to wait for the extension to return HTML | `12000` |

## Running

```bash
# Development (watch mode — restarts on file changes)
npm run start:dev

# Production
npm run build
npm run start:prod
```

API runs at `http://localhost:3000`.

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests (API must be running on :3000)
npm run test:e2e

# Integration test — WS registration + scrape round-trip
npm run test:integration

# With coverage
npm run test:cov
```

## Project Structure

```
src/
  app.module.ts          Root module
  main.ts                Bootstrap — sets global prefix /v1, CORS, WS adapter
  common/
    dto/
      ws-messages.ts     Shared TypeScript types for WS message payloads
  gateway/
    extension.gateway.ts WebSocket gateway — handles register + html messages
    gateway.module.ts
  health/                GET /v1/health endpoint
  rooms/
    rooms.service.ts     Core session logic — page registry, secret validation, HTML relay
    rooms-store.ts       JSON file persistence for room secrets across restarts
    rooms.module.ts
  scrape/
    scrape.controller.ts GET /v1/scrape endpoints
    scrape-cache.ts      Cache-control header helpers + HTML body wrapper
    scrape.module.ts
data/
  rooms-store.json       Auto-created at runtime — persists room secrets
scripts/
  test-integration.mjs   Integration test script
test/
  jest-e2e.json
```

## Linting & Formatting

```bash
npm run lint    # ESLint --fix
npm run format  # Prettier
```

## Deployment

The API must be reachable by ChatGPT's servers for the scrape feature to work. Use a public HTTPS tunnel in development or deploy to a cloud host like Render, Railway, or Fly.io.

```bash
# Cloudflare Tunnel (recommended — no timeout issues)
cloudflared tunnel --url http://localhost:3000

# or ngrok
ngrok http 3000
```

Set `VITE_API_PUBLIC_URL` in `newExtension/.env` to your tunnel/deploy URL, then rebuild the extension.

> **Note:** `data/rooms-store.json` is gitignored. Room secrets persist across API restarts but reset if the file is deleted (e.g. on a fresh deploy). Always copy a fresh scrape URL from the extension popup after redeploying.
