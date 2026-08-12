import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DomainModule } from '../domain/domain.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [AuthModule, DomainModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
