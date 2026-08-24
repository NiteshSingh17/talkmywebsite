import {
  ExtensionWsMessage,
  ServerWsMessage,
  WS_URL,
} from '@src/shared/protocol';
import { getRoomId, getRoomSecret } from './room';
import { getAllPages } from './page-store';

const EXT_VERSION = chrome.runtime.getManifest().version;

let ws: WebSocket | null = null;
let wsConnected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let serverMessageHandler: ((msg: ServerWsMessage) => Promise<void>) | null = null;

/** Register the single handler for messages coming from the API server. */
export function onServerMessage(
  handler: (msg: ServerWsMessage) => Promise<void>,
): void {
  serverMessageHandler = handler;
}

export function isWsConnected(): boolean {
  return wsConnected;
}

export function sendWs(msg: ExtensionWsMessage): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function connectWs(): void {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return;
  }
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    wsConnected = true;
    announceSelf();
    replayKnownPages();
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(String(ev.data)) as ServerWsMessage;
      void serverMessageHandler?.(msg);
    } catch {
      /* ignore malformed frames */
    }
  };

  ws.onclose = () => {
    wsConnected = false;
    scheduleReconnect();
  };

  ws.onerror = () => {
    wsConnected = false;
    console.warn('[NewExtension] WebSocket error check VITE_WS_URL:', WS_URL);
  };
}

function announceSelf(): void {
  sendWs({
    type: 'register',
    roomId: getRoomId(),
    roomSecret: getRoomSecret(),
    extensionVersion: EXT_VERSION,
  });
}

function replayKnownPages(): void {
  for (const p of getAllPages()) {
    sendWs({
      type: 'page_registered',
      pageId: p.pageId,
      url: p.url,
      tabId: p.tabId,
      title: p.title,
    });
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWs();
  }, 3000);
}
