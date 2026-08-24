import type { RegisteredPage } from '@src/shared/protocol';
import { getPage } from '../page-store';
import { findTabForPage, syncPageFromTab } from '../page-registration';
import { LivePageSnapshot, readLivePage } from './read-live-page';

const PAGE_NOT_OPEN = '<!-- WEBCHAT_PAGE_NOT_OPEN -->';

/** Serializes concurrent scrapes per page so results never interleave. */
const scrapeChains = new Map<string, Promise<unknown>>();

function withScrapeLock<T>(pageId: string, fn: () => Promise<T>): Promise<T> {
  const prev = scrapeChains.get(pageId) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  scrapeChains.set(pageId, run.catch(() => undefined));
  return run;
}

/**
 * Capture a registered page's cleaned HTML. Returns PAGE_NOT_OPEN when the
 * page is unknown or its tab cannot be reached/read.
 */
export async function scrapePageHtml(
  pageId: string,
  opts: { fromSidebar?: boolean } = {},
): Promise<string> {
  return withScrapeLock(pageId, () => doScrape(pageId, opts.fromSidebar === true));
}

async function doScrape(pageId: string, fromSidebar: boolean): Promise<string> {
  const page = getPage(pageId);

  let tab: chrome.tabs.Tab | null = null;

  if (fromSidebar) {
    // Prefer the registered tab for this pageId; the side panel may have stolen
    // window focus so getActiveHttpTab() could return the wrong tab.
    tab = page ? await findTabForPage(page) : null;
    if (!tab?.id) {
      tab = await getActiveHttpTab();
    }
  } else {
    if (!page) return PAGE_NOT_OPEN;
    tab = await findTabForPage(page);
  }

  if (!tab?.id) {
    return PAGE_NOT_OPEN;
  }

  if (page) await syncPageFromTab(page, tab);

  await waitForPageSettle(tab.id, { timeoutMs: 2_500 });

  const tabId = tab.id;
  tab = (await chrome.tabs.get(tabId)) ?? tab;
  if (page) await syncPageFromTab(page, tab);

  const snap = await readLivePage(tabId);

  if (snap?.html) {
    return formatScrapeHtml(snap, pageId);
  }

  return PAGE_NOT_OPEN;
}

/** Wrap the snapshot in comment headers so consumers can detect freshness. */
function formatScrapeHtml(snap: LivePageSnapshot, pageId: string): string {
  const nonce = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const safeTitle = snap.title.replace(/-->/g, '');
  const safeUrl = snap.url.replace(/-->/g, '');
  return (
    `<!-- webchat-scrape-nonce: ${nonce} -->\n` +
    `<!-- webchat-page-id: ${pageId} -->\n` +
    `<!-- webchat-live-url: ${safeUrl} -->\n` +
    `<!-- webchat-live-title: ${safeTitle} -->\n` +
    snap.html
  );
}

/** Poll until URL/title stop changing (SPAs update the bar before the DOM). */
async function waitForPageSettle(
  tabId: number,
  opts: { timeoutMs?: number } = {},
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const deadline = Date.now() + timeoutMs;
  let lastKey = '';
  let stableTicks = 0;

  while (Date.now() < deadline) {
    const snap = await readLivePage(tabId);
    if (!snap) break;
    const key = `${snap.url}\n${snap.title}`;

    if (key === lastKey) {
      stableTicks++;
      if (stableTicks >= 2) {
        await sleep(400);
        return;
      }
    } else {
      lastKey = key;
      stableTicks = 0;
    }

    await sleep(250);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Side panel is not a tab scrape the focused window's active http(s) page. */
async function getActiveHttpTab(): Promise<chrome.tabs.Tab | null> {
  const [focused] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (focused?.id && focused.url?.startsWith('http')) {
    return focused;
  }

  const [anyActive] = await chrome.tabs.query({ active: true });
  if (anyActive?.id && anyActive.url?.startsWith('http')) {
    return anyActive;
  }

  return null;
}
