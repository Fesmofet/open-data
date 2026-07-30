import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import {
  buildNotificationMessage,
  renderPlainText,
} from '@opden-data-layer/notifications-messages';
import {
  TELEGRAM_STREAM_DATA_FIELD,
  TELEGRAM_STREAM_KEY,
} from '../constants/telegram.constants';
import { TelegramSubscriptionsCacheService } from './telegram-subscriptions-cache.service';
import { EN_NOTIFICATION_DICTIONARY } from './en-dictionary';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
    private readonly subscriptionsCache: TelegramSubscriptionsCacheService,
  ) {}

  isEnabled(): boolean {
    const token = this.config.get<string>('telegram.botToken');
    return typeof token === 'string' && token.length > 0;
  }

  async enqueue(
    username: string,
    event: AnyNotificationEvent,
    itemId: string,
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      return;
    }
    try {
      const chatIds = await this.subscriptionsCache.getChatIds(trimmed);
      if (chatIds.length === 0) {
        return;
      }
      const message = buildNotificationMessage(event);
      const baseUrl =
        this.config.get<string>('telegram.webPublicOrigin') ??
        'http://localhost:3000';
      const text = renderPlainText(message, EN_NOTIFICATION_DICTIONARY, {
        baseUrl,
      });
      const redis = this.redisFactory.getClient();
      await redis.xAdd(TELEGRAM_STREAM_KEY, {
        [TELEGRAM_STREAM_DATA_FIELD]: JSON.stringify({
          chatIds,
          text,
          itemId,
          account: trimmed,
        }),
      });
    } catch (err) {
      this.logger.error(
        `enqueue failed for ${username}: ${(err as Error).message}`,
      );
    }
  }
}
