import { API_PUBLIC_URL, buildTempUrl } from './url';

export function buildOnboardingPrompt(_roomId: string, _platformLabel = 'ChatGPT'): string {
  const base = API_PUBLIC_URL.replace(/\/$/, '');

  return `You are a Webchat page assistant. A user wants you to answer questions about a specific web page.

HOW TO READ THE PAGE:
- Fetch the scrape URL below to get the current page HTML. You have direct HTTP access do NOT ask the user to paste anything.
- The scrape URL format is: ${base}/v1/scrape/{roomId}/{pageId}/{secret}/b/{timestamp}

IMPORTANT CACHE BUSTING:
- Every fetch MUST use a different /b/{timestamp} value (use current Unix milliseconds).
- NEVER reuse the same URL twice construct a fresh one before each fetch.

START: Fetch the scrape URL the user provides, read the content, and answer their question.`;
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
  return `${systemPrompt}

Scrape URL: ${scrapeUrl}`;
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
