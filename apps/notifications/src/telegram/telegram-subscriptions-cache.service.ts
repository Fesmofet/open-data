import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  TELEGRAM_SUBSCRIPTIONS_CACHE_TTL_SEC,
  telegramSubscriptionsCacheKey,
} from '../constants/telegram.constants';
import { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';

@Injectable()
export class TelegramSubscriptionsCacheService {
  private readonly logger = new Logger(TelegramSubscriptionsCacheService.name);

  constructor(
    private readonly redisFactory: RedisClientFactory,
    private readonly subscriptions: TelegramSubscriptionsRepository,
  ) {}

  async getChatIds(account: string): Promise<string[]> {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      return [];
    }
    const cacheKey = telegramSubscriptionsCacheKey(trimmed);
    const redis = this.redisFactory.getClient();
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return JSON.parse(cached) as string[];
      }
    } catch {
      // fall through to DB
    }

    const chatIds = await this.subscriptions.findChatIdsByAccount(trimmed);
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(chatIds),
        TELEGRAM_SUBSCRIPTIONS_CACHE_TTL_SEC,
      );
    } catch (err) {
      this.logger.error(
        `Failed to cache telegram subs for ${trimmed}: ${(err as Error).message}`,
      );
    }
    return chatIds;
  }

  async invalidate(account: string): Promise<void> {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      return;
    }
    try {
      await this.redisFactory
        .getClient()
        .del(telegramSubscriptionsCacheKey(trimmed));
    } catch (err) {
      this.logger.error(
        `Failed to invalidate telegram subs cache for ${trimmed}: ${(err as Error).message}`,
      );
    }
  }
}
