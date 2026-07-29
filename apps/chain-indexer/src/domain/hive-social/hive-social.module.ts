import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { FollowSocialService } from './follow-social.service';
import { ReblogSocialService } from './reblog-social.service';
import { AccountProfileUpdateService } from './account-profile-update.service';
import { AccountEnsureService } from './account-ensure.service';
import { AccountSyncWorker } from './account-sync.worker';
import { AccountLastActivityService } from './account-last-activity.service';

@Module({
  imports: [RepositoriesModule, NotificationAdapterModule],
  providers: [
    FollowSocialService,
    ReblogSocialService,
    AccountProfileUpdateService,
    AccountEnsureService,
    AccountSyncWorker,
    AccountLastActivityService,
  ],
  exports: [
    FollowSocialService,
    ReblogSocialService,
    AccountProfileUpdateService,
    AccountEnsureService,
    AccountLastActivityService,
  ],
})
export class HiveSocialModule {}
