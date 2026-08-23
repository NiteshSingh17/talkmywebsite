import { Global, Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Global()
@Module({
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
