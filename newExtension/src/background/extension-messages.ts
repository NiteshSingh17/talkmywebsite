import { MSG, RegisteredPage, WS_URL } from '@src/shared/protocol';
import { buildInitialPrefix } from '@src/shared/onboarding';
import { whenReady } from './boot';
import { getAllPages, getPage } from './page-store';
import { registerTabAsPage } from './page-registration';
import { getRoomId, getRoomSecret } from './room';
import { scrapePageHtml } from './scraping/scrape-page';
import { isWsConnected } from './websocket';

interface StatusResponse {
  connected: boolean;
  roomId: string;
  wsUrl: string;
  pages: RegisteredPage[];
}

interface PrepareSidepanelResponse {
  ok: true;
  pageId: string;
  tabId: number;
}

interface InitialPrefixResponse {
  prefix: string;
}

let lastPreparedPageId = '';

/** Register chrome.runtime.onMessage routing for extension pages (popup etc). */
export function listenRuntimeMessages(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const handle = async () => {
      await whenReady();
      switch (message?.type) {
        case MSG.GET_STATUS:
          return buildStatus();
        case MSG.PREPARE_SIDEPANEL:
          return prepareSidepanel(message.tabId as number | undefined);
        case MSG.GET_INITIAL_PREFIX:
          return getInitialPrefix();
        default:
          return null;
      }
    };

    handle()
      .then(sendResponse)
      .catch((e) =>
        sendResponse({
          error: e instanceof Error ? e.message : 'Unknown error',
        }),
      );
    return true;
  });
}

function buildStatus(): StatusResponse {
  return {
    connected: isWsConnected(),
    roomId: getRoomId(),
    wsUrl: WS_URL,
    pages: getAllPages(),
  };
}

/**
 * Bind the target tab as a scrapeable page and verify it can actually be
 * scraped before the caller opens the side panel.
 */
export async function prepareSidepanel(
  tabId?: number,
): Promise<PrepareSidepanelResponse> {
  const targetTab = tabId
    ? await chrome.tabs.get(tabId)
    : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

  if (!targetTab?.id || !targetTab.url?.startsWith('http')) {
    throw new Error('No active web page tab to analyse');
  }

  const page = await registerTabAsPage(targetTab);

  const checkHtml = await scrapePageHtml(page.pageId);
  if (checkHtml.includes('WEBCHAT_PAGE_NOT_OPEN')) {
    throw new Error('Could not read the tab — make sure it is a normal web page.');
  }

  lastPreparedPageId = page.pageId;
  return { ok: true, pageId: page.pageId, tabId: targetTab.id };
}

function getInitialPrefix(): InitialPrefixResponse {
  const page = lastPreparedPageId
    ? getPage(lastPreparedPageId)
    : getAllPages().at(-1);

  if (!page) {
    throw new Error('No prepared page');
  }

  return {
    prefix: buildInitialPrefix(getRoomId(), page.pageId, getRoomSecret()),
  };
}
