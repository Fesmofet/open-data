import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { HiveCommentParserModule } from '../hive-comment/hive-comment-parser.module';
import { WaivPostRewardModule } from '../waiv-post-reward/waiv-post-reward.module';
import { HivePostSyncWorker } from './hive-post-sync.worker';
import { VoteHiveService } from './vote-hive.service';

@Module({
  imports: [RepositoriesModule, HiveCommentParserModule, WaivPostRewardModule, NotificationAdapterModule],
  providers: [VoteHiveService, HivePostSyncWorker],
  exports: [VoteHiveService],
})
export class HiveVoteModule {}
