import { Injectable, Logger, OnModuleDestroy, OnApplicationBootstrap } from '@nestjs/common';

const PING_URL = process.env.SELF_PING_URL ?? 'https://talkmywebsite.bitsmall.in/v1/health';
const PING_INTERVAL_MS = Number(process.env.SELF_PING_INTERVAL_MS ?? 10 * 60 * 1000);

@Injectable()
export class SelfPingService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SelfPingService.name);
  private timer?: NodeJS.Timeout;

  onApplicationBootstrap(): void {
    this.logger.log(`Self-ping enabled: ${PING_URL} every ${PING_INTERVAL_MS}ms`);
    this.timer = setInterval(() => void this.ping(), PING_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async ping(): Promise<void> {
    try {
      const res = await fetch(PING_URL);
      this.logger.log(`Self-ping -> ${res.status} ${res.statusText}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Self-ping failed: ${message}`);
    }
  }
}
