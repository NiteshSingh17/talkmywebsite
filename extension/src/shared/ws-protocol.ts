export interface RegisteredPage {
  pageId: string;
  tabId: number;
  url: string;
  title: string;
  hostname: string;
}

/** Extension → server */
export type ExtensionWsMessage =
  | { type: 'register'; roomId: string; roomSecret: string; extensionVersion?: string }
  | { type: 'page_registered'; pageId: string; url: string; tabId: number; title: string }
  | { type: 'page_closed'; pageId: string }
  | { type: 'html_result'; requestId: string; pageId: string; html: string }
  | { type: 'pong' };

/** Server → extension */
export type ServerWsMessage =
  | { type: 'get_html'; requestId: string; pageId: string; fromSidebar?: boolean }
  | { type: 'ping' };
