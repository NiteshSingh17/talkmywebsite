import { RegisteredPage, STORAGE_KEYS, normalizeUrl } from '@src/shared/protocol';

const pages = new Map<string, RegisteredPage>();

export async function loadPersistedPages(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.pages);
  const savedPages =
    (stored[STORAGE_KEYS.pages] as Record<string, RegisteredPage>) ?? {};
  pages.clear();
  for (const p of Object.values(savedPages)) {
    pages.set(p.pageId, p);
  }
}

export function getPage(pageId: string): RegisteredPage | undefined {
  return pages.get(pageId);
}

export function getAllPages(): RegisteredPage[] {
  return [...pages.values()];
}

export function findPageByTabOrUrl(
  tabId: number,
  normalizedUrl: string,
): RegisteredPage | undefined {
  return getAllPages().find(
    (p) => p.tabId === tabId || normalizeUrl(p.url) === normalizedUrl,
  );
}

export async function savePage(page: RegisteredPage): Promise<void> {
  pages.set(page.pageId, page);
  await persist();
}

export async function deletePage(pageId: string): Promise<void> {
  pages.delete(pageId);
  await persist();
}

async function persist(): Promise<void> {
  const obj: Record<string, RegisteredPage> = {};
  for (const [id, p] of pages) obj[id] = p;
  await chrome.storage.local.set({ [STORAGE_KEYS.pages]: obj });
}
