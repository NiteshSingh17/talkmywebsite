import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { ExtensionMessage } from '../common/dto/ws-messages';
import { RoomsService } from '../rooms/rooms.service';

interface SocketMeta {
  roomId?: string;
  registered: boolean;
}

@WebSocketGateway({ path: '/ws' })
export class ExtensionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ExtensionGateway.name);
  private readonly socketMeta = new WeakMap<WebSocket, SocketMeta>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly rooms: RoomsService) {}

  handleConnection(client: WebSocket): void {
    this.socketMeta.set(client, { registered: false });

    client.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as ExtensionMessage;
        this.handleMessage(client, msg);
      } catch (err) {
        this.logger.warn(`Invalid WS message: ${err}`);
      }
    });
  }

  handleDisconnect(client: WebSocket): void {
    const meta = this.socketMeta.get(client);
    if (meta?.roomId) {
      this.rooms.disconnectSocket(meta.roomId, client);
    }
  }

  private handleMessage(client: WebSocket, msg: ExtensionMessage): void {
    if (msg.type === 'register') {
      const meta = this.socketMeta.get(client) ?? { registered: false };
      meta.roomId = msg.roomId;
      meta.registered = true;
      this.socketMeta.set(client, meta);
      this.rooms.registerExtension(msg.roomId, msg.roomSecret, client);
      return;
    }

    const meta = this.socketMeta.get(client);
    if (!meta?.registered || !meta.roomId) {
      client.send(JSON.stringify({ type: 'error', message: 'Not registered' }));
      return;
    }

    this.rooms.handleExtensionMessage(meta.roomId, msg);
  }
}
