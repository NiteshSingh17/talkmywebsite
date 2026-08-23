/**
 * Integration test: simulates extension WS + scrape flow.
 * Run: node scripts/test-integration.mjs (API must be on :3000)
 */
import WebSocket from 'ws';

const API = process.env.API_URL ?? 'http://localhost:3000';
const WS_URL = process.env.WS_URL ?? 'ws://localhost:3000/ws';
const roomId = 'test-room-' + Date.now();
const roomSecret = 'test-secret-' + Date.now();
const pageId = 'test-page-1';

const sampleHtml = '<!DOCTYPE html><html><body><h1>Webchat test</h1></body></html>';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const ws = new WebSocket(WS_URL);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
    setTimeout(() => reject(new Error('WS connect timeout')), 5000);
  });

  ws.send(
    JSON.stringify({
      type: 'register',
      roomId,
      roomSecret,
      extensionVersion: 'test',
    }),
  );

  ws.send(
    JSON.stringify({
      type: 'page_registered',
      pageId,
      url: 'https://example.com',
      tabId: 1,
      title: 'Example',
    }),
  );

  ws.on('message', (data) => {
    const msg = JSON.parse(String(data));
    if (msg.type === 'get_html') {
      ws.send(
        JSON.stringify({
          type: 'html_result',
          requestId: msg.requestId,
          pageId: msg.pageId,
          html: sampleHtml,
        }),
      );
    }
  });

  await sleep(300);

  const scrapeUrl = `${API}/v1/scrape/${roomId}/${pageId}?t=${encodeURIComponent(roomSecret)}`;
  const res = await fetch(scrapeUrl);
  const body = await res.text();

  console.log('Scrape status:', res.status);
  console.log('Scrape body preview:', body.slice(0, 120));

  if (res.status !== 200) {
    console.error('FAIL: expected 200');
    process.exit(1);
  }
  if (!body.includes('Webchat test')) {
    console.error('FAIL: HTML missing expected content');
    process.exit(1);
  }

  const bad = await fetch(`${API}/v1/scrape/${roomId}/${pageId}`);
  if (bad.status !== 401) {
    console.error('FAIL: missing secret should be 401, got', bad.status);
    process.exit(1);
  }

  console.log('PASS: integration test OK');
  ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
