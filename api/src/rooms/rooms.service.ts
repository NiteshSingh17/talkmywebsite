import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';
import {
  ExtensionMessage,
  PageMeta,
  ServerMessage,
} from '../common/dto/ws-messages';
import { loadRoomsStore, RoomsStoreFile, saveRoomsStore } from './rooms-store';

interface PendingHtml {
  resolve: (html: string) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

interface RoomState {
  roomSecret: string;
  socket: WebSocket | null;
  pages: Map<string, PageMeta>;
  pendingHtml: Map<string, PendingHtml>;
}

@Injectable()
export class RoomsService implements OnModuleInit {
  private readonly logger = new Logger(RoomsService.name);
  private readonly rooms = new Map<string, RoomState>();
  private persisted: RoomsStoreFile = {};

  onModuleInit(): void {
    this.persisted = loadRoomsStore();
    for (const [roomId, data] of Object.entries(this.persisted)) {
      const room = this.getOrCreateRoom(roomId);
      room.roomSecret = data.roomSecret;
      for (const meta of Object.values(data.pages ?? {})) {
        room.pages.set(meta.pageId, meta);
      }
    }
    this.logger.log(
      `Loaded ${Object.keys(this.persisted).length} room(s) from disk`,
    );
  }

  private persistRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room?.roomSecret) return;

    const pages: Record<string, PageMeta> = {};
    for (const [id, meta] of room.pages) {
      pages[id] = meta;
    }

    this.persisted[roomId] = {
      roomSecret: room.roomSecret,
      pages,
      updatedAt: Date.now(),
    };
    saveRoomsStore(this.persisted);
  }

  private getOrCreateRoom(roomId: string): RoomState {
    let room = this.rooms.get(roomId);
    if (!room) {
      const stored = this.persisted[roomId];
      room = {
        roomSecret: stored?.roomSecret ?? '',
        socket: null,
        pages: new Map(),
        pendingHtml: new Map(),
      };
      if (stored?.pages) {
        for (const meta of Object.values(stored.pages)) {
          room.pages.set(meta.pageId, meta);
        }
      }
      this.rooms.set(roomId, room);
    }
    return room;
  }

  registerExtension(
    roomId: string,
    roomSecret: string,
    socket: WebSocket,
  ): void {
    const room = this.getOrCreateRoom(roomId);
    if (room.socket && room.socket !== socket) {
      try {
        room.socket.close();
      } catch {
        /* ignore */
      }
    }
    room.roomSecret = roomSecret;
    room.socket = socket;
    this.persistRoom(roomId);
    this.logger.log(`Extension connected for room ${roomId}`);
  }

  disconnectSocket(roomId: string, socket: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (room?.socket === socket) {
      room.socket = null;
      for (const [, pending] of room.pendingHtml) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Extension disconnected'));
      }
      room.pendingHtml.clear();
    }
  }

  validateSecret(roomId: string, secret: string): boolean {
    if (!secret) return false;

    const room = this.getOrCreateRoom(roomId);
    if (room.roomSecret && room.roomSecret === secret) {
      return true;
    }

    const stored = this.persisted[roomId];
    if (stored?.roomSecret === secret) {
      room.roomSecret = secret;
      return true;
    }

    return false;
  }

  getAuthHint(roomId: string): string {
    const hasPersisted = !!this.persisted[roomId]?.roomSecret;
    const online = this.isExtensionOnline(roomId);
    if (!hasPersisted && !online) {
      return 'Open the Webchat extension popup and wait for a green Connected status, then copy a fresh scrape URL.';
    }
    if (!online) {
      return 'Extension is not connected to the API. Start the API, reload the extension, and copy a new scrape URL.';
    }
    return 'Copy a new scrape URL from the extension (old links break after API reinstall or room reset).';
  }

  isExtensionOnline(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!room?.socket && room.socket.readyState === WebSocket.OPEN;
  }

  registerPage(roomId: string, meta: PageMeta): void {
    const room = this.getOrCreateRoom(roomId);
    room.pages.set(meta.pageId, meta);
    this.persistRoom(roomId);
  }

  removePage(roomId: string, pageId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.pages.delete(pageId);
    this.persistRoom(roomId);
  }

  getPage(roomId: string, pageId: string): PageMeta | undefined {
    return this.getOrCreateRoom(roomId).pages.get(pageId);
  }

  handleExtensionMessage(roomId: string, raw: ExtensionMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    switch (raw.type) {
      case 'page_registered':
        this.registerPage(roomId, {
          pageId: raw.pageId,
          url: raw.url,
          tabId: raw.tabId,
          title: raw.title,
          lastSeen: Date.now(),
        });
        break;
      case 'page_closed':
        this.removePage(roomId, raw.pageId);
        break;
      case 'html_result': {
        const pending = room.pendingHtml.get(raw.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          room.pendingHtml.delete(raw.requestId);
          pending.resolve(raw.html);
        }
        break;
      }
      case 'pong':
        break;
      default:
        break;
    }
  }

  sendToExtension(roomId: string, message: ServerMessage): boolean {
    const room = this.rooms.get(roomId);
    if (!room?.socket || room.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    room.socket.send(JSON.stringify(message));
    return true;
  }

  getPublicStatus(): {
    rooms: Array<{
      roomId: string;
      extensionOnline: boolean;
      pageCount: number;
    }>;
  } {
    const ids = new Set([
      ...Object.keys(this.persisted),
      ...this.rooms.keys(),
    ]);
    const rooms = [...ids].map((roomId) => ({
      roomId,
      extensionOnline: this.isExtensionOnline(roomId),
      pageCount: this.getOrCreateRoom(roomId).pages.size,
    }));
    return { rooms };
  }

  requestHtml(
    roomId: string,
    pageId: string,
    timeoutMs: number,
    clientBust?: string,
    fromSidebar = false,
  ): Promise<string> {
    if (!this.isExtensionOnline(roomId)) {
      return Promise.reject(
        new ServiceUnavailableException(
          'Webchat extension is not connected. Open the extension popup and ensure the API server is running on the same port as configured in the extension.',
        ),
      );
    }

    const page = this.getPage(roomId, pageId);
    if (!page) {
      return Promise.reject(
        new Error(
          `Page ${pageId} is not registered. Copy a fresh Webchat URL from the extension while the tab is open.`,
        ),
      );
    }

    const room = this.rooms.get(roomId)!;
    const requestId = randomUUID();

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        room.pendingHtml.delete(requestId);
        reject(new Error('Timed out waiting for page HTML from extension'));
      }, timeoutMs);

      room.pendingHtml.set(requestId, { resolve, reject, timer });

      const sent = this.sendToExtension(roomId, {
        type: 'get_html',
        requestId,
        pageId,
        ...(clientBust ? { clientBust } : {}),
        ...(fromSidebar ? { fromSidebar: true } : {}),
      });
      if (!sent) {
        clearTimeout(timer);
        room.pendingHtml.delete(requestId);
        reject(
          new ServiceUnavailableException('Failed to reach extension'),
        );
      }
    });
  }
}
