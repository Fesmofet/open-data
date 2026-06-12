import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { PostWaivReconcileQueue } from '../hive-engine-parser/post-waiv-reconcile.queue';
import { WaivPostRewardService } from '../hive-engine-parser/waiv-post-reward.service';
import { WaivRewardEventDedupCache } from '../hive-engine-parser/waiv-reward-event-dedup.cache';
import { WaivRewardPoolCache } from '../hive-engine-parser/waiv-reward-pool.cache';
import { PostRewardsFinalizeQueue } from './post-rewards-finalize.queue';

@Module({
  imports: [RepositoriesModule],
  providers: [
    WaivRewardPoolCache,
    WaivRewardEventDedupCache,
    PostWaivReconcileQueue,
    PostRewardsFinalizeQueue,
    WaivPostRewardService,
  ],
  exports: [
    WaivRewardPoolCache,
    WaivRewardEventDedupCache,
    PostWaivReconcileQueue,
    PostRewardsFinalizeQueue,
    WaivPostRewardService,
  ],
})
export class WaivPostRewardModule {}
