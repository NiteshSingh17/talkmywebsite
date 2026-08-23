import { Module } from '@nestjs/common';
import { ScrapeController } from './scrape.controller';

@Module({
  controllers: [ScrapeController],
})
export class ScrapeModule {}
