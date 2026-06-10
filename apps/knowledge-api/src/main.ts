import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  const globalPrefix = 'knowledge';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({ origin: true });
  const port = process.env.PORT || 7400;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`MCP endpoint: http://localhost:${port}/${globalPrefix}/mcp`);
}

bootstrap();
