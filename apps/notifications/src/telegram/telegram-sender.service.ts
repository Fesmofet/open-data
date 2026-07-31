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
  TELEGRAM_SENDER_CONSUMER_DEFAULT,
  TELEGRAM_SENDER_GROUP,
  TELEGRAM_SENT_DEDUP_TTL_SEC,
  TELEGRAM_STREAM_BATCH_SIZE,
  TELEGRAM_STREAM_DATA_FIELD,
  TELEGRAM_STREAM_KEY,
  telegramSentDedupKey,
} from '../constants/telegram.constants';
import { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';
import { TelegramApiClient } from './telegram-api.client';
import { buildNotificationInlineKeyboard } from './telegram-inline-keyboard';

interface QueuedTelegramPayload {
  chatIds: string[];
  text: string;
  websiteUrl?: string;
  itemId: string;
  account: string;
}

@Injectable()
export class TelegramSenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramSenderService.name);
  private readonly consumerName: string;
  private running = false;
  private loopPromise: Promise<void> | null = null;
  private lastGlobalSendMs = 0;
  private readonly lastChatSendMs = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
    private readonly api: TelegramApiClient,
    private readonly subscriptions: TelegramSubscriptionsRepository,
  ) {
    this.consumerName =
      config.get<string>('telegram.senderConsumerName') ??
      TELEGRAM_SENDER_CONSUMER_DEFAULT;
  }

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
    this.loopPromise = this.reclaimAndDrainPending().then(() => this.consumeLoop());
    this.logger.log(
      `Telegram sender started (consumer=${this.consumerName})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise;
    }
  }

  /** Reclaim PEL entries orphaned by prior consumer names, then drain our own pending. */
  private async reclaimAndDrainPending(): Promise<void> {
    const reclaimed = await this.reclaimOrphanedPending();
    const drained = await this.drainOwnPending();
    if (reclaimed + drained === 0) {
      this.logger.debug(
        `Telegram queue startup: no pending entries for ${this.consumerName}`,
      );
    }
  }

  /** XAUTOCLAIM entries stuck on dead consumers (pid-based names from older builds). */
  private async reclaimOrphanedPending(): Promise<number> {
    const redis = this.redisFactory.getClient();
    let reclaimed = 0;
    let start = '0-0';
    try {
      while (this.running) {
        const { nextStart, entries } = await redis.xAutoClaim(
          TELEGRAM_STREAM_KEY,
          TELEGRAM_SENDER_GROUP,
          this.consumerName,
          0,
          start,
          TELEGRAM_STREAM_BATCH_SIZE,
        );
        start = nextStart;
        if (entries.length === 0) {
          break;
        }
        reclaimed += await this.processBatch(entries);
      }
    } catch (err) {
      this.logger.error(
        `Telegram orphaned reclaim failed: ${(err as Error).message}`,
      );
    }
    if (reclaimed > 0) {
      this.logger.log(
        `Reclaimed ${reclaimed} orphaned telegram queue entries for ${this.consumerName}`,
      );
    }
    return reclaimed;
  }

  /** Reclaim PEL entries from prior crashes or failed sends before reading new ones. */
  private async drainOwnPending(): Promise<number> {
    const redis = this.redisFactory.getClient();
    let drained = 0;
    try {
      while (this.running) {
        const entries = await redis.xReadGroup(
          TELEGRAM_SENDER_GROUP,
          this.consumerName,
          [{ key: TELEGRAM_STREAM_KEY, id: '0' }],
          { count: TELEGRAM_STREAM_BATCH_SIZE },
        );
        if (entries.length === 0) {
          break;
        }
        drained += await this.processBatch(entries);
      }
    } catch (err) {
      this.logger.error(
        `Telegram pending drain failed: ${(err as Error).message}`,
      );
    }
    if (drained > 0) {
      this.logger.log(
        `Drained ${drained} pending telegram queue entries for ${this.consumerName}`,
      );
    }
    return drained;
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
          { count: TELEGRAM_STREAM_BATCH_SIZE, blockMs: 2000 },
        );
        if (entries.length === 0) {
          continue;
        }

        const acked = await this.processBatch(entries);
        if (acked > 0) {
          this.logger.log(`Delivered ${acked} telegram queue entries`);
        }
      } catch (err) {
        if (this.running) {
          this.logger.error(
            `Telegram sender stream read failed: ${(err as Error).message}`,
          );
          await this.sleep(1000);
        }
      }
    }
  }

  private async processBatch(
    entries: { id: string; fields: Record<string, string> }[],
  ): Promise<number> {
    const redis = this.redisFactory.getClient();
    let acked = 0;
    for (const entry of entries) {
      try {
        const shouldAck = await this.processEntry(entry.fields);
        if (shouldAck) {
          await redis.xAck(
            TELEGRAM_STREAM_KEY,
            TELEGRAM_SENDER_GROUP,
            entry.id,
          );
          acked += 1;
        }
      } catch (err) {
        this.logger.error(
          `Telegram delivery failed for ${entry.id}: ${(err as Error).message}`,
        );
      }
    }
    return acked;
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

    const result = await this.api.sendMessage(chatId, payload.text, {
      replyMarkup: buildNotificationInlineKeyboard(
        payload.account,
        payload.websiteUrl,
      ),
    });
    if (result.ok) {
      return true;
    }

    if (result.errorCode === 403) {
      await this.subscriptions.unsubscribe(chatId, payload.account);
      this.logger.warn(`Telegram chat ${chatId} blocked bot; unsubscribed`);
      return true;
    }

    if (result.errorCode === 429) {
      const waitSec = result.retryAfterSec ?? 1;
      await redis.del(dedupKey);
      await this.sleep(waitSec * 1000);
      return false;
    }

    if (result.errorCode === 0 || result.errorCode >= 500) {
      await redis.del(dedupKey);
      this.logger.warn(
        `Telegram send retryable failure (${result.errorCode}): ${result.description ?? 'unknown'}`,
      );
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
