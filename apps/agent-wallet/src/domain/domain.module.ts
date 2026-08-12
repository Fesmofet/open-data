import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { HasSessionService } from './has-session.service';
import { PendingRequestsStore } from './pending-requests.store';

@Module({
  imports: [AuthModule],
  providers: [PendingRequestsStore, HasSessionService],
  exports: [HasSessionService, PendingRequestsStore],
})
export class DomainModule {}
