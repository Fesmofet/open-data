import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  TELEGRAM_PER_CHAT_MIN_INTERVAL_MS,
  TELEGRAM_SENDER_GROUP,
  TELEGRAM_SENT_DEDUP_TTL_SEC,
  TELEGRAM_STREAM_DATA_FIELD,
  TELEGRAM_STREAM_KEY,
  telegramSentDedupKey,
} from '../constants/telegram.constants';
import { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';
import { TelegramApiClient } from './telegram-api.client';
import { TelegramSubscriptionsCacheService } from './telegram-subscriptions-cache.service';

interface QueuedTelegramPayload {
  chatIds: string[];
  text: string;
  itemId: string;
  account: string;
}

@Injectable()
export class TelegramSenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramSenderService.name);
  private readonly consumerName = `${process.env.HOSTNAME ?? 'notifications'}-${process.pid}-tg`;
  private running = false;
  private loopPromise: Promise<void> | null = null;
  private lastGlobalSendMs = 0;
  private readonly lastChatSendMs = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
    private readonly api: TelegramApiClient,
    private readonly subscriptions: TelegramSubscriptionsRepository,
    private readonly subscriptionsCache: TelegramSubscriptionsCacheService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.api.isConfigured()) {
      return;
    }
    const redis = this.redisFactory.getClient();
    await redis.xGroupCreate(
      TELEGRAM_STREAM_KEY,
      TELEGRAM_SENDER_GROUP,
      '$',
      true,
    );
    this.running = true;
    this.loopPromise = this.consumeLoop();
    this.logger.log('Telegram sender started');
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise;
    }
  }

  private minGlobalIntervalMs(): number {
    const rate = this.config.get<number>('telegram.sendRatePerSec') ?? 25;
    return Math.ceil(1000 / Math.max(1, rate));
  }

  private async consumeLoop(): Promise<void> {
    const redis = this.redisFactory.getClient();
    while (this.running) {
      try {
        const entries = await redis.xReadGroup(
          TELEGRAM_SENDER_GROUP,
          this.consumerName,
          [{ key: TELEGRAM_STREAM_KEY, id: '>' }],
          { count: 5, blockMs: 2000 },
        );
        for (const entry of entries) {
          const ack = await this.processEntry(entry.fields);
          if (ack) {
            await redis.xAck(
              TELEGRAM_STREAM_KEY,
              TELEGRAM_SENDER_GROUP,
              entry.id,
            );
          }
        }
      } catch (err) {
        if (this.running) {
          this.logger.error(`Telegram sender poll: ${(err as Error).message}`);
          await this.sleep(1000);
        }
      }
    }
  }

  private async processEntry(
    fields: Record<string, string>,
  ): Promise<boolean> {
    const raw = fields[TELEGRAM_STREAM_DATA_FIELD];
    if (!raw) {
      return true;
    }
    let payload: QueuedTelegramPayload;
    try {
      payload = JSON.parse(raw) as QueuedTelegramPayload;
    } catch {
      this.logger.warn('Skipping corrupt telegram queue entry');
      return true;
    }
    let allDone = true;
    for (const chatId of payload.chatIds) {
      const done = await this.deliverToChat(chatId, payload);
      if (!done) {
        allDone = false;
      }
    }
    return allDone;
  }

  private async deliverToChat(
    chatId: string,
    payload: QueuedTelegramPayload,
  ): Promise<boolean> {
    const redis = this.redisFactory.getClient();
    const dedupKey = telegramSentDedupKey(payload.itemId, chatId);
    const first = await redis.trySetNx(
      dedupKey,
      '1',
      TELEGRAM_SENT_DEDUP_TTL_SEC,
    );
    if (!first) {
      return true;
    }

    await this.throttle(chatId);

    const result = await this.api.sendMessage(chatId, payload.text);
    if (result.ok) {
      return true;
    }

    if (result.errorCode === 403) {
      await this.subscriptions.unsubscribe(chatId, payload.account);
      await this.subscriptionsCache.invalidate(payload.account);
      this.logger.warn(`Telegram chat ${chatId} blocked bot; unsubscribed`);
      return true;
    }

    if (result.errorCode === 429) {
      const waitSec = result.retryAfterSec ?? 1;
      await redis.del(dedupKey);
      await this.sleep(waitSec * 1000);
      return false;
    }

    this.logger.warn(
      `Telegram send failed (${result.errorCode}): ${result.description ?? 'unknown'}`,
    );
    return true;
  }

  private async throttle(chatId: string): Promise<void> {
    const globalWait =
      this.minGlobalIntervalMs() - (Date.now() - this.lastGlobalSendMs);
    const chatLast = this.lastChatSendMs.get(chatId) ?? 0;
    const chatWait =
      TELEGRAM_PER_CHAT_MIN_INTERVAL_MS - (Date.now() - chatLast);
    const wait = Math.max(0, globalWait, chatWait);
    if (wait > 0) {
      await this.sleep(wait);
    }
    const now = Date.now();
    this.lastGlobalSendMs = now;
    this.lastChatSendMs.set(chatId, now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
