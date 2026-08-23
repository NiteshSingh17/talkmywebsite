import { Module } from '@nestjs/common';
import { ExtensionGateway } from './extension.gateway';

@Module({
  providers: [ExtensionGateway],
})
export class GatewayModule {}
