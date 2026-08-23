/** Normalize WS URL — fixes common mistakes like ws://https://host/ws */
export function resolveWsUrl(raw?: string): string {
  let url = (raw ?? 'ws://localhost:3000/ws').trim();
  // Broken: ws://https://example.com/ws
  url = url.replace(/^wss?:\/\/https?:\/\//i, 'wss://');
  url = url.replace(/^ws:\/\/https:\/\//i, 'wss://');
  url = url.replace(/^ws:\/\/http:\/\//i, 'ws://');
  // User pasted https ngrok URL for WS — upgrade to wss (optional; local ws:// is preferred)
  if (/^https:\/\//i.test(url)) {
    url = url.replace(/^https:\/\//i, 'wss://');
  }
  if (!url.endsWith('/ws')) {
    url = url.replace(/\/?$/, '') + '/ws';
  }
  return url;
}

export const WS_URL = resolveWsUrl(import.meta.env.VITE_WS_URL);

export const API_PUBLIC_URL =
  import.meta.env.VITE_API_PUBLIC_URL ?? 'http://localhost:3000';

export function buildTempUrl(
  roomId: string,
  pageId: string,
  roomSecret: string,
  opts?: { sidebar?: boolean },
): string {
  const base = API_PUBLIC_URL.replace(/\/$/, '');
  const cb = Date.now();
  const sidebar = opts?.sidebar ? '&sidebar=true' : '';
  return `${base}/v1/scrape/${roomId}/${pageId}/${roomSecret}?cb=${cb}${sidebar}`;
}

/** Strip hash/trailing slash and add scheme so tab URLs can be compared. */
export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  try {
    const parsed = new URL(u);
    parsed.hash = '';
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    parsed.pathname = path;
    return parsed.href;
  } catch {
    return u;
  }
}
