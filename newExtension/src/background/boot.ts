import { loadPersistedPages } from './page-store';
import { loadRoomCredentials } from './room';
import { handleServerMessage } from './server-messages';
import { connectWs, onServerMessage, sendWs } from './websocket';

let readyPromise: Promise<void> | null = null;

/**
 * Resolve once credentials/pages are loaded and the WebSocket layer is wired.
 * Message handlers must await this so they never run against half-initialized
 * state on service-worker cold starts.
 */
export function whenReady(): Promise<void> {
  readyPromise ??= boot();
  return readyPromise;
}

async function boot(): Promise<void> {
  await loadRoomCredentials();
  await loadPersistedPages();
  onServerMessage(handleServerMessage);
  connectWs();
  setInterval(() => sendWs({ type: 'pong' }), 25_000);
}
