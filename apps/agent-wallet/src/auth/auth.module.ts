import { Module } from '@nestjs/common';

import { LocalFilesService } from '../domain/local-files.service';
import { AgentWalletAuthService } from './agent-wallet-auth.service';

@Module({
  providers: [LocalFilesService, AgentWalletAuthService],
  exports: [LocalFilesService, AgentWalletAuthService],
})
export class AuthModule {}
