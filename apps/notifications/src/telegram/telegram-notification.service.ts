import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import {
  buildNotificationMessage,
  renderTelegramBody,
  resolveNotificationAbsoluteUrl,
} from '@opden-data-layer/notifications-messages';
import {
  TELEGRAM_RECIPIENT_PARAM,
  TELEGRAM_STREAM_DATA_FIELD,
  TELEGRAM_STREAM_KEY,
} from '../constants/telegram.constants';
import { EN_NOTIFICATION_DICTIONARY } from './en-dictionary';

export interface TelegramEnqueueRequest {
  account: string;
  chatIds: string[];
  event: AnyNotificationEvent;
  itemId: string;
}

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  isEnabled(): boolean {
    const token = this.config.get<string>('telegram.botToken');
    return typeof token === 'string' && token.length > 0;
  }

  /** Queues a whole batch with a single Redis pipeline. */
  async enqueueMany(requests: TelegramEnqueueRequest[]): Promise<void> {
    if (!this.isEnabled() || requests.length === 0) {
      return;
    }

    const baseUrl =
      this.config.get<string>('telegram.webPublicOrigin') ??
      'http://localhost:3000';

    try {
      const pipe = this.redisFactory.getClient().pipeline();
      let queued = 0;
      for (const request of requests) {
        const account = request.account.trim();
        if (account.length === 0 || request.chatIds.length === 0) {
          continue;
        }
        const message = buildNotificationMessage(request.event);
        const text = renderTelegramBody(message, EN_NOTIFICATION_DICTIONARY, {
          extraParams: { [TELEGRAM_RECIPIENT_PARAM]: account },
        });
        const websiteUrl = resolveNotificationAbsoluteUrl(message, baseUrl);
        pipe.xAdd(TELEGRAM_STREAM_KEY, {
          [TELEGRAM_STREAM_DATA_FIELD]: JSON.stringify({
            chatIds: request.chatIds,
            text,
            websiteUrl,
            itemId: request.itemId,
            account,
          }),
        });
        queued += 1;
      }
      if (queued === 0) {
        return;
      }
      await pipe.exec();
    } catch (err) {
      this.logger.error(`enqueueMany failed: ${(err as Error).message}`);
    }
  }
}
