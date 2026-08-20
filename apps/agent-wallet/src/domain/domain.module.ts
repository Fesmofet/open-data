import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import {
  HiveBroadcastService,
  WalletStatusService,
} from './hive-broadcast.service';
import { HasSessionService } from './has-session.service';
import { HivePostBuildService } from './hive-post-build.service';
import { IpfsUploadService } from './ipfs-upload.service';
import { LocalKeysService } from './local-keys.service';
import { NotificationsSocketService } from './notifications-socket.service';
import { OslMessagingService } from './osl-messaging.service';
import { PendingRequestsStore } from './pending-requests.store';
import { WaivioAuthClientService } from './waivio-auth-client.service';
import { WaivioAuthOrchestratorService } from './waivio-auth-orchestrator.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';

@Module({
  imports: [AuthModule],
  providers: [
    PendingRequestsStore,
    HasSessionService,
    WaivioAuthClientService,
    WaivioAuthSessionService,
    WaivioAuthOrchestratorService,
    LocalKeysService,
    OslMessagingService,
    NotificationsSocketService,
    HiveBroadcastService,
    WalletStatusService,
    HivePostBuildService,
    IpfsUploadService,
  ],
  exports: [
    HasSessionService,
    HivePostBuildService,
    WaivioAuthOrchestratorService,
    WaivioAuthSessionService,
    HiveBroadcastService,
    WalletStatusService,
    IpfsUploadService,
    LocalKeysService,
    OslMessagingService,
    NotificationsSocketService,
    PendingRequestsStore,
  ],
})
export class DomainModule {}
