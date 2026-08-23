import { RegisteredPage, normalizeUrl } from '@src/shared/protocol';
import { deletePage, findPageByTabOrUrl, getAllPages, savePage } from './page-store';
import { sendWs } from './websocket';

/**
 * Bind a tab to a stable pageId, persist it and announce it to the server so
 * the server can later request its HTML via `get_html`.
 */
export async function registerTabAsPage(tab: chrome.tabs.Tab): Promise<RegisteredPage> {
  const tabId = tab.id!;
  const url = tab.url ?? '';
  const existing = findPageByTabOrUrl(tabId, normalizeUrl(url));
  const pageId = existing?.pageId ?? crypto.randomUUID();
  const page: RegisteredPage = {
    pageId,
    tabId,
    url,
    title: tab.title ?? url,
    hostname: tryHostname(url),
  };
  await savePage(page);
  announcePage(page);
  return page;
}

/**
 * Resolve a registered page back to a live tab. Falls back to searching open
 * tabs by normalized URL when the original tab was closed or discarded.
 */
export async function findTabForPage(
  page: RegisteredPage,
): Promise<chrome.tabs.Tab | null> {
  try {
    const tab = await chrome.tabs.get(page.tabId);
    if (tab?.id) {
      await syncPageFromTab(page, tab);
      return tab;
    }
  } catch {
    /* tab gone */
  }

  const all = await chrome.tabs.query({});
  const normalized = normalizeUrl(page.url);
  const exact = all.find((t) => t.url && normalizeUrl(t.url) === normalized);
  if (exact) {
    page.tabId = exact.id!;
    await savePage(page);
    return exact;
  }

  return null;
}

/** Keep the stored page URL/title in sync with what the tab currently shows. */
export async function syncPageFromTab(
  page: RegisteredPage,
  tab: chrome.tabs.Tab,
): Promise<void> {
  if (tab.url?.startsWith('http')) {
    page.url = tab.url;
    page.title = tab.title ?? page.title;
    page.hostname = tryHostname(tab.url);
    await savePage(page);
  }
}

export function announcePage(page: RegisteredPage): void {
  sendWs({
    type: 'page_registered',
    pageId: page.pageId,
    url: page.url,
    tabId: page.tabId,
    title: page.title,
  });
}

/** Drop pages whose tab closed and tell the server they are gone. */
export function watchTabRemoval(): void {
  chrome.tabs.onRemoved.addListener((tabId) => {
    void removePagesForClosedTab(tabId);
  });
}

async function removePagesForClosedTab(tabId: number): Promise<void> {
  for (const p of getAllPages()) {
    if (p.tabId !== tabId) continue;
    await deletePage(p.pageId);
    sendWs({ type: 'page_closed', pageId: p.pageId });
  }
}

function tryHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
