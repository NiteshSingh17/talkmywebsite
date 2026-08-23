import { Response } from 'express';

/** Headers so Cloudflare, Claude fetch, and browsers never reuse a scrape body. */
export function applyScrapeNoCacheHeaders(
  res: Response,
  opts: { requestId: string; scrapedAt: string; clientBust?: string },
): void {
  res
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0')
    .setHeader('Pragma', 'no-cache')
    .setHeader('Expires', '0')
    .setHeader('CDN-Cache-Control', 'no-store')
    .setHeader('Cloudflare-CDN-Cache-Control', 'no-store')
    .setHeader('Surrogate-Control', 'no-store')
    .setHeader('Vary', '*')
    .setHeader('X-Webchat-Request-Id', opts.requestId)
    .setHeader('X-Webchat-Scraped-At', opts.scrapedAt);
  if (opts.clientBust) {
    res.setHeader('X-Webchat-Client-Bust', opts.clientBust);
  }
}

export function buildScrapeBody(
  html: string,
  opts: { requestId: string; scrapedAt: string; clientBust?: string },
): string {
  const bustLine = opts.clientBust
    ? `<!-- webchat-client-bust: ${opts.clientBust} -->\n`
    : '';
  return (
    `<div id="webchat-fetch-banner" data-webchat-live="true" style="font:12px/1.4 monospace;padding:8px;margin:0 0 12px;border:2px solid #2563eb;background:#eff6ff">\n` +
    `Webchat live fetch — NOT cached. request-id=${opts.requestId} scraped-at=${opts.scrapedAt}` +
    (opts.clientBust ? ` client-bust=${opts.clientBust}` : '') +
    `. Each fetch must use a new <code>/b/&lt;timestamp&gt;</code> path segment.\n` +
    `</div>\n` +
    `<!-- webchat-request-id: ${opts.requestId} -->\n` +
    `<!-- webchat-scraped-at: ${opts.scrapedAt} -->\n` +
    bustLine +
    html
  );
}
