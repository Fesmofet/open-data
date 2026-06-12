import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { chainIndexerRedisKey } from '../constants/chain-indexer-redis-keys';

@Injectable()
export class PostRewardsFinalizeQueue {
  private readonly logger = new Logger(PostRewardsFinalizeQueue.name);

  constructor(private readonly redisFactory: RedisClientFactory) {}

  private memberKey(author: string, permlink: string): string {
    return `${author}:${permlink}`;
  }

  async claimDue(
    nowUnix: number,
    limit: number,
  ): Promise<Array<{ author: string; permlink: string }>> {
    const key = chainIndexerRedisKey.postRewardsFinalize();
    try {
      const redis = this.redisFactory.getClient(0);
      const members = await redis.zRangeByScore(key, '-inf', String(nowUnix), 0, limit);
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
      this.logger.warn(`post rewards finalize claim failed: ${(e as Error).message}`);
      return [];
    }
  }

  async remove(author: string, permlink: string): Promise<void> {
    const key = chainIndexerRedisKey.postRewardsFinalize();
    try {
      const redis = this.redisFactory.getClient(0);
      await redis.zRem(key, this.memberKey(author, permlink));
    } catch (e) {
      this.logger.warn(
        `post rewards finalize remove failed for ${author}/${permlink}: ${
          (e as Error).message
        }`,
      );
    }
  }
}
