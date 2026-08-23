import { STORAGE_KEYS } from '@src/shared/protocol';

let roomId = '';
let roomSecret = '';

/** Load roomId/roomSecret from storage, creating and persisting them on first run. */
export async function loadRoomCredentials(): Promise<void> {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.roomId,
    STORAGE_KEYS.roomSecret,
  ]);
  roomId = (stored[STORAGE_KEYS.roomId] as string) || crypto.randomUUID();
  roomSecret = (stored[STORAGE_KEYS.roomSecret] as string) || crypto.randomUUID();
  await chrome.storage.local.set({
    [STORAGE_KEYS.roomId]: roomId,
    [STORAGE_KEYS.roomSecret]: roomSecret,
  });
}

export function getRoomId(): string {
  return roomId;
}

export function getRoomSecret(): string {
  return roomSecret;
}
