import { API_PUBLIC_URL, buildTempUrl } from './url';

export function buildOnboardingPrompt(_roomId: string, _platformLabel = 'ChatGPT'): string {
  const base = API_PUBLIC_URL.replace(/\/$/, '');

  return `You are a page-reading assistant. A scrape URL is provided below — fetch it to get the current page HTML, then answer the user's question.

Rules:
- Fetch the URL directly. Do not ask the user to paste anything.
- Never reuse the same URL twice.
- Use new URL for each new page.

Scrape URL:`;
}

/** System instructions + scrape URL (no user question). */
export function buildInitialPrefix(
  roomId: string,
  pageId: string,
  roomSecret: string,
  platformLabel = 'ChatGPT',
): string {
  const scrapeUrl = buildTempUrl(roomId, pageId, roomSecret, { sidebar: true });
  const systemPrompt = buildOnboardingPrompt(roomId, platformLabel);
  return `${systemPrompt} ${scrapeUrl}`;
}

export function buildPagePrompt(
  roomId: string,
  pageId: string,
  roomSecret: string,
  platformLabel: string,
  userQuestion: string,
): string {
  return `${buildInitialPrefix(roomId, pageId, roomSecret, platformLabel)}

User question: ${userQuestion}`;
}
