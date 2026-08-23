import { ServerWsMessage } from '@src/shared/protocol';
import { sendWs } from './websocket';
import { scrapePageHtml } from './scraping/scrape-page';

/** Handle one message received from the API server over WebSocket. */
export async function handleServerMessage(msg: ServerWsMessage): Promise<void> {
  switch (msg.type) {
    case 'ping':
      sendWs({ type: 'pong' });
      return;
    case 'get_html':
      await answerGetHtml(msg.requestId, msg.pageId, !!msg.fromSidebar);
      return;
  }
}

async function answerGetHtml(
  requestId: string,
  pageId: string,
  fromSidebar: boolean,
): Promise<void> {
  const html = await scrapePageHtml(pageId, { fromSidebar });
  sendWs({
    type: 'html_result',
    requestId,
    pageId,
    html,
  });
}
