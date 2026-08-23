import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';
import { HealthModule } from './health/health.module';
import { RoomsModule } from './rooms/rooms.module';
import { ScrapeModule } from './scrape/scrape.module';

@Module({
  imports: [RoomsModule, GatewayModule, ScrapeModule, HealthModule],
})
export class AppModule {}
