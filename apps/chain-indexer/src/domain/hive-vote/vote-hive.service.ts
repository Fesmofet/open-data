import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../database';
import { KYSELY } from '../../database';
import { PostWaivReconcileQueue } from '../hive-engine-parser/post-waiv-reconcile.queue';
import { PostSyncQueueRepository } from '../../repositories/post-sync-queue.repository';
import { PostsRepository } from '../../repositories/posts.repository';
import { SocialGraphRepository } from '../../repositories/social-graph.repository';
import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { voteOperationSchema } from './vote-hive.schema';
import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';
import {
  evaluateVoteLikeNotification,
  thirdPlaceWeightFromTopWeights,
} from './vote-like-notification.policy';

const WEIGHT_FILTER_MIN_OTHER_LIKES = 5;
const WEIGHT_FILTER_TOP_N = 3;

@Injectable()
export class VoteHiveService {
  private readonly logger = new Logger(VoteHiveService.name);

  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly postsRepository: PostsRepository,
    private readonly postSyncQueueRepository: PostSyncQueueRepository,
    private readonly postWaivReconcileQueue: PostWaivReconcileQueue,
    private readonly socialGraphRepository: SocialGraphRepository,
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

    let postExists = false;
    await this.db.transaction().execute(async (trx) => {
      postExists = await this.postsRepository.applyChainVoteIfPostExists(
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

    if (weight < 0) {
      if (!postExists) {
        return;
      }
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'vote_downvote',
        objectId: null,
        actor: voter,
        payload: { voter, author, permlink, weight },
      });
      return;
    }

    const rootPost = await this.postsRepository.findRootPostByAuthorPermlink(
      author,
      permlink,
    );
    const likesCount = await this.postsRepository.countOtherActiveUpvotes(
      author,
      permlink,
      voter,
    );
    let authorFollowsVoter = false;
    let thirdPlaceWeightAmongOthers = 0;
    if (likesCount > WEIGHT_FILTER_MIN_OTHER_LIKES) {
      authorFollowsVoter = await this.socialGraphRepository.subscriptionExists(
        author,
        voter,
      );
      const topWeights = await this.postsRepository.topExistingUpvoteWeights(
        author,
        permlink,
        voter,
        WEIGHT_FILTER_TOP_N,
      );
      thirdPlaceWeightAmongOthers = thirdPlaceWeightFromTopWeights(topWeights);
    }

    const likeNotification = evaluateVoteLikeNotification({
      voter,
      weight,
      isRootPost: rootPost !== undefined,
      title: rootPost?.title ?? null,
      likesCount,
      thirdPlaceWeightAmongOthers,
      authorFollowsVoter,
    });
    if (!likeNotification) {
      return;
    }

    this.notificationEmitter.emitWithContext(emitCtx, {
      type: 'vote_like',
      objectId: null,
      actor: voter,
      payload: {
        voter,
        author,
        permlink,
        weight,
        title: likeNotification.title,
        likesCount: likeNotification.likesCount,
      },
    });
  }
}
