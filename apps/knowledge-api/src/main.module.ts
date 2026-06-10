import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import knowledgeApiConfig from './config/knowledge-api.config';
import { DatabaseModule } from './database/database.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/knowledge-api/.env', '.env'],
      load: [knowledgeApiConfig],
    }),
    DatabaseModule,
    McpModule,
  ],
})
export class MainModule {}
