import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { redisKey } from '../../constants/redis-keys';

@Injectable()
export class PostRewardsFinalizeQueue {
  private readonly logger = new Logger(PostRewardsFinalizeQueue.name);

  constructor(private readonly redisFactory: RedisClientFactory) {}

  private memberKey(author: string, permlink: string): string {
    return `${author}:${permlink}`;
  }

  async schedule(author: string, permlink: string, dueUnix: number): Promise<void> {
    const key = redisKey.postRewardsFinalize();
    const member = this.memberKey(author, permlink);
    try {
      const redis = this.redisFactory.getClient(0);
      await redis.zAdd(key, dueUnix, member);
    } catch (e) {
      this.logger.warn(
        `post rewards finalize schedule failed for ${author}/${permlink}: ${
          (e as Error).message
        }`,
      );
    }
  }

  async remove(author: string, permlink: string): Promise<void> {
    const key = redisKey.postRewardsFinalize();
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
