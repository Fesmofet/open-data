import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import agentWalletConfig from './config/agent-wallet.config';
import { validateAgentWalletEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/agent-wallet/.env', '.env'],
      load: [agentWalletConfig],
      validate: validateAgentWalletEnv,
    }),
    HealthModule,
    McpModule,
  ],
})
export class MainModule {}
