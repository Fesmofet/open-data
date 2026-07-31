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
    await this.logPendingSummary('startup');
    const reclaimed = await this.claimAllPending('orphaned');
    const drained = await this.drainOwnPending();
    const total = reclaimed + drained;
    if (total === 0) {
      this.logger.log(
        `Telegram queue startup: 0 pending entries for ${this.consumerName} (XLEN does not shrink on ACK)`,
      );
    }
  }

  private async logPendingSummary(phase: string): Promise<void> {
    const redis = this.redisFactory.getClient();
    try {
      const pending = await redis.xPending(
        TELEGRAM_STREAM_KEY,
        TELEGRAM_SENDER_GROUP,
        '-',
        '+',
        100,
      );
      if (pending.length === 0) {
        this.logger.log(
          `Telegram queue ${phase}: no XPENDING entries in ${TELEGRAM_SENDER_GROUP}`,
        );
        return;
      }
      const byConsumer = new Map<string, number>();
      for (const row of pending) {
        byConsumer.set(row.consumer, (byConsumer.get(row.consumer) ?? 0) + 1);
      }
      const summary = [...byConsumer.entries()]
        .map(([consumer, count]) => `${consumer}=${count}`)
        .join(', ');
      this.logger.log(
        `Telegram queue ${phase}: ${pending.length} XPENDING (${summary})`,
      );
    } catch (err) {
      this.logger.warn(
        `Telegram queue ${phase}: XPENDING failed: ${(err as Error).message}`,
      );
    }
  }

  /** XCLAIM every pending entry in the group, regardless of prior consumer name. */
  private async claimAllPending(label: string): Promise<number> {
    const redis = this.redisFactory.getClient();
    let processed = 0;
    try {
      while (this.running) {
        const pending = await redis.xPending(
          TELEGRAM_STREAM_KEY,
          TELEGRAM_SENDER_GROUP,
          '-',
          '+',
          TELEGRAM_STREAM_BATCH_SIZE,
        );
        if (pending.length === 0) {
          break;
        }
        const entries = await redis.xClaim(
          TELEGRAM_STREAM_KEY,
          TELEGRAM_SENDER_GROUP,
          this.consumerName,
          0,
          ...pending.map((row) => row.id),
        );
        if (entries.length === 0) {
          break;
        }
        const { acked, failed } = await this.processBatch(entries);
        processed += acked;
        if (failed > 0) {
          this.logger.warn(
            `Telegram ${label}: ${failed} entries still pending after delivery attempt`,
          );
          break;
        }
      }
    } catch (err) {
      this.logger.error(
        `Telegram ${label} reclaim failed: ${(err as Error).message}`,
      );
    }
    if (processed > 0) {
      this.logger.log(
        `Telegram ${label}: delivered and acked ${processed} queue entries`,
      );
    }
    return processed;
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
        const { acked, failed } = await this.processBatch(entries);
        drained += acked;
        if (failed > 0) {
          break;
        }
      }
    } catch (err) {
      this.logger.error(
        `Telegram pending drain failed: ${(err as Error).message}`,
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

        const { acked } = await this.processBatch(entries);
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
  ): Promise<{ acked: number; failed: number }> {
    const redis = this.redisFactory.getClient();
    let acked = 0;
    let failed = 0;
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
        } else {
          failed += 1;
        }
      } catch (err) {
        failed += 1;
        this.logger.error(
          `Telegram delivery failed for ${entry.id}: ${(err as Error).message}`,
        );
      }
    }
    return { acked, failed };
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
    if (await redis.exists(dedupKey)) {
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
      await redis.set(dedupKey, '1', TELEGRAM_SENT_DEDUP_TTL_SEC);
      return true;
    }

    if (result.errorCode === 403) {
      await this.subscriptions.unsubscribe(chatId, payload.account);
      this.logger.warn(`Telegram chat ${chatId} blocked bot; unsubscribed`);
      return true;
    }

    if (result.errorCode === 429) {
      const waitSec = result.retryAfterSec ?? 1;
      await this.sleep(waitSec * 1000);
      return false;
    }

    if (result.errorCode === 0 || result.errorCode >= 500) {
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
