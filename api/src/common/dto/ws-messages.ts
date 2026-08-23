export type PageCommand =
  | { action: 'click'; selector: string }
  | { action: 'navigate'; url: string }
  | { action: 'scroll'; x?: number; y?: number; behavior?: 'auto' | 'smooth' };

export interface PageMeta {
  pageId: string;
  url: string;
  tabId: number;
  title: string;
  lastSeen: number;
}

/** Extension → server */
export type ExtensionMessage =
  | { type: 'register'; roomId: string; roomSecret: string; extensionVersion?: string }
  | { type: 'page_registered'; pageId: string; url: string; tabId: number; title: string }
  | { type: 'page_closed'; pageId: string }
  | { type: 'html_result'; requestId: string; pageId: string; html: string }
  | { type: 'command_result'; requestId: string; success: boolean; error?: string; data?: unknown }
  | { type: 'pong' };

/** Server → extension */
export type ServerMessage =
  | {
      type: 'get_html';
      requestId: string;
      pageId: string;
      clientBust?: string;
      fromSidebar?: boolean;
    }
  | { type: 'run_command'; requestId: string; pageId: string; command: PageCommand }
  | { type: 'ping' };
