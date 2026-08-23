import { Controller, Get } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';

@Controller()
export class HealthController {
  constructor(private readonly rooms: RoomsService) {}

  /** Fast check — use via ngrok to verify tunnel + API (no extension needed) */
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'webchat-api',
      time: new Date().toISOString(),
    };
  }

  @Get('health/rooms')
  roomsStatus() {
    return this.rooms.getPublicStatus();
  }
}
