import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PageMeta } from '../common/dto/ws-messages';

export interface PersistedRoom {
  roomSecret: string;
  pages: Record<string, PageMeta>;
  updatedAt: number;
}

export type RoomsStoreFile = Record<string, PersistedRoom>;

const DATA_DIR = join(process.cwd(), 'data');
const STORE_PATH = join(DATA_DIR, 'rooms-store.json');

export function loadRoomsStore(): RoomsStoreFile {
  try {
    if (!existsSync(STORE_PATH)) return {};
    const raw = readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw) as RoomsStoreFile;
  } catch {
    return {};
  }
}

export function saveRoomsStore(store: RoomsStoreFile): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}
