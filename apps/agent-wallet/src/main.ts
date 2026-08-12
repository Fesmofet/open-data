import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import type { AgentWalletConfig } from './config/agent-wallet.config';
import { MainModule } from './main.module';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  const config = app.get(ConfigService<AgentWalletConfig, true>);
  const globalPrefix = 'agent-wallet';
  app.setGlobalPrefix(globalPrefix);

  const host = config.get('host', { infer: true });
  const port = config.get('port', { infer: true });

  await app.listen(port, host);
  Logger.log(
    `Application is running on: http://${host}:${port}/${globalPrefix}`,
    'Bootstrap',
  );
  Logger.log(
    `MCP endpoint: http://${host}:${port}/${globalPrefix}/mcp`,
    'Bootstrap',
  );
}

bootstrap();
