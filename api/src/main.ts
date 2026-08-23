import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix('v1');
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`Webchat API listening on http://0.0.0.0:${port}`);
  console.log(`Health:  http://localhost:${port}/v1/health`);
  console.log(`WebSocket: ws://localhost:${port}/ws`);
  console.log(
    `Scrape: http://localhost:${port}/v1/scrape/{roomId}/{pageId}/{secret}/b/{timestamp}`,
  );
}
bootstrap();
