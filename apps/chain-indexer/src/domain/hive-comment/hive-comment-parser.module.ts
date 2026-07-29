import { Module } from '@nestjs/common';
import { WaivPostRewardModule } from '../waiv-post-reward/waiv-post-reward.module';
import { GovernanceModule } from '../governance/governance.module';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { CommentPostObjectBindService } from './comment-post-object-bind.service';
import { CommentOperationOrchestrator } from './comment-orchestrator.service';
import { PostUpsertService } from './post-upsert.service';
import { PostRelatedImagesSyncService } from './post-related-images-sync.service';
import { ThreadParseService } from './thread-parse.service';
import { HiveCommentNotificationService } from './hive-comment-notification.service';

@Module({
  imports: [RepositoriesModule, GovernanceModule, WaivPostRewardModule, NotificationAdapterModule],
  providers: [
    PostUpsertService,
    PostRelatedImagesSyncService,
    ThreadParseService,
    CommentPostObjectBindService,
    HiveCommentNotificationService,
    CommentOperationOrchestrator,
  ],
  exports: [CommentOperationOrchestrator, PostUpsertService],
})
export class HiveCommentParserModule {}
