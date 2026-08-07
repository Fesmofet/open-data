import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { redisKey } from '../../constants/redis-keys';

@Injectable()
export class PostWaivReconcileQueue {
  private readonly logger = new Logger(PostWaivReconcileQueue.name);

  constructor(private readonly redisFactory: RedisClientFactory) {}

  private memberKey(author: string, permlink: string): string {
    return `${author}:${permlink}`;
  }

  async markDirty(author: string, permlink: string, atUnix: number): Promise<void> {
    const key = redisKey.postWaivReconcile();
    const member = this.memberKey(author, permlink);
    try {
      const redis = this.redisFactory.getClient(0);
      await redis.zAdd(key, atUnix, member);
    } catch (e) {
      this.logger.warn(
        `post waiv reconcile enqueue failed for ${author}/${permlink}: ${
          (e as Error).message
        }`,
      );
    }
  }

  /** Claims most recently dirtied posts (highest score first). */
  async claimNewest(limit: number): Promise<Array<{ author: string; permlink: string }>> {
    const key = redisKey.postWaivReconcile();
    try {
      const redis = this.redisFactory.getClient(0);
      const members =
        limit > 0 ? await redis.zRevRange(key, 0, limit - 1) : [];
      return members
        .map((m) => {
          const colon = m.indexOf(':');
          if (colon <= 0) {
            return null;
          }
          return {
            author: m.slice(0, colon),
            permlink: m.slice(colon + 1),
          };
        })
        .filter((x): x is { author: string; permlink: string } => x !== null);
    } catch (e) {
      this.logger.warn(`post waiv reconcile claim failed: ${(e as Error).message}`);
      return [];
    }
  }

  /** Bump score to now so failed entries rotate to the back of the queue. */
  async touchDirty(author: string, permlink: string): Promise<void> {
    const atUnix = Math.floor(Date.now() / 1000);
    await this.markDirty(author, permlink, atUnix);
  }

  async remove(author: string, permlink: string): Promise<void> {
    const key = redisKey.postWaivReconcile();
    try {
      const redis = this.redisFactory.getClient(0);
      await redis.zRem(key, this.memberKey(author, permlink));
    } catch (e) {
      this.logger.warn(
        `post waiv reconcile remove failed for ${author}/${permlink}: ${
          (e as Error).message
        }`,
      );
    }
  }
}
