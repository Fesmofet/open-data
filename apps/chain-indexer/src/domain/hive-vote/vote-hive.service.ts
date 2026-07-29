import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../database';
import { KYSELY } from '../../database';
import { PostWaivReconcileQueue } from '../hive-engine-parser/post-waiv-reconcile.queue';
import { PostSyncQueueRepository } from '../../repositories/post-sync-queue.repository';
import { PostsRepository } from '../../repositories/posts.repository';
import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { voteOperationSchema } from './vote-hive.schema';
import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';

@Injectable()
export class VoteHiveService {
  private readonly logger = new Logger(VoteHiveService.name);

  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly postsRepository: PostsRepository,
    private readonly postSyncQueueRepository: PostSyncQueueRepository,
    private readonly postWaivReconcileQueue: PostWaivReconcileQueue,
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

  async handleVote(
    payload: Record<string, unknown>,
    context: HiveOperationHandlerContext,
  ): Promise<void> {
    const parsed = voteOperationSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid vote payload: ${parsed.error.message}`);
      return;
    }
    const { voter, author, permlink, weight } = parsed.data;
    const enqueuedAt = blockTimestampToUnixSeconds(context.timestamp);

    await this.db.transaction().execute(async (trx) => {
      const postExists = await this.postsRepository.applyChainVoteIfPostExists(
        trx,
        author,
        permlink,
        voter,
        weight,
      );

      await this.postSyncQueueRepository.enqueue(
        author,
        permlink,
        enqueuedAt,
        !postExists,
        trx,
      );
    });

    await this.postWaivReconcileQueue.markDirty(author, permlink, enqueuedAt);

    const emitCtx = this.notificationEmitter.hiveContext(context);
    if (voter === author) {
      const post = await this.postsRepository.findByKey(author, permlink);
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'my_vote',
        objectId: null,
        actor: voter,
        payload: {
          voter,
          author,
          permlink,
          title: post?.title ?? null,
        },
      });
      return;
    }

    const type = weight < 0 ? 'vote_downvote' : 'vote_like';
    this.notificationEmitter.emitWithContext(emitCtx, {
      type,
      objectId: null,
      actor: voter,
      payload: { voter, author, permlink, weight },
    });
  }
}
