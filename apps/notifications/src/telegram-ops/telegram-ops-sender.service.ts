import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  renderSystemAlertText,
  SYSTEM_ALERT_CONSUMER_GROUP,
  SYSTEM_ALERT_STREAM_DATA_FIELD,
  SYSTEM_ALERT_STREAM_KEY,
  systemAlertSchema,
} from '@opden-data-layer/system-alerts';
import {
  TELEGRAM_OPS_PER_CHAT_MIN_INTERVAL_MS,
  TELEGRAM_OPS_SENT_DEDUP_TTL_SEC,
  telegramOpsSentDedupKey,
} from './telegram-ops.constants';
import { OpsTelegramSubscribersRepository } from '../repositories/ops-telegram-subscribers.repository';
import { TelegramApiClient } from '../telegram/telegram-api.client';

@Injectable()
export class TelegramOpsSenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramOpsSenderService.name);
  private readonly consumerName = `${process.env.HOSTNAME ?? 'notifications'}-${process.pid}-ops-tg`;
  private running = false;
  private loopPromise: Promise<void> | null = null;
  private lastGlobalSendMs = 0;
  private readonly lastChatSendMs = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
    private readonly api: TelegramApiClient,
    private readonly subscribers: OpsTelegramSubscribersRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.api.isConfigured()) {
      return;
    }
    const redis = this.redisFactory.getClient();
    await redis.xGroupCreate(
      SYSTEM_ALERT_STREAM_KEY,
      SYSTEM_ALERT_CONSUMER_GROUP,
      '$',
      true,
    );
    this.running = true;
    this.loopPromise = this.consumeLoop();
    this.logger.log('Telegram ops sender started');
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
          SYSTEM_ALERT_CONSUMER_GROUP,
          this.consumerName,
          [{ key: SYSTEM_ALERT_STREAM_KEY, id: '>' }],
          { count: 5, blockMs: 2000 },
        );
        for (const entry of entries) {
          const ack = await this.processEntry(entry.id, entry.fields);
          if (ack) {
            await redis.xAck(
              SYSTEM_ALERT_STREAM_KEY,
              SYSTEM_ALERT_CONSUMER_GROUP,
              entry.id,
            );
          }
        }
      } catch (err) {
        if (this.running) {
          this.logger.error(
            `Telegram ops sender poll: ${(err as Error).message}`,
          );
          await this.sleep(1000);
        }
      }
    }
  }

  private async processEntry(
    streamId: string,
    fields: Record<string, string>,
  ): Promise<boolean> {
    const raw = fields[SYSTEM_ALERT_STREAM_DATA_FIELD];
    if (!raw) {
      return true;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      this.logger.warn('Skipping corrupt system-alerts queue entry');
      return true;
    }
    const alertResult = systemAlertSchema.safeParse(parsed);
    if (!alertResult.success) {
      this.logger.warn('Skipping invalid system-alerts payload');
      return true;
    }
    const text = renderSystemAlertText(alertResult.data);
    const chatIds = await this.subscribers.findAllChatIds();
    if (chatIds.length === 0) {
      return true;
    }
    let allDone = true;
    for (const chatId of chatIds) {
      const done = await this.deliverToChat(streamId, chatId, text);
      if (!done) {
        allDone = false;
      }
    }
    return allDone;
  }

  private async deliverToChat(
    streamId: string,
    chatId: string,
    text: string,
  ): Promise<boolean> {
    const redis = this.redisFactory.getClient();
    const dedupKey = telegramOpsSentDedupKey(streamId, chatId);
    const first = await redis.trySetNx(
      dedupKey,
      '1',
      TELEGRAM_OPS_SENT_DEDUP_TTL_SEC,
    );
    if (!first) {
      return true;
    }

    await this.throttle(chatId);

    const result = await this.api.sendMessage(chatId, text);
    if (result.ok) {
      return true;
    }

    if (result.errorCode === 403) {
      await this.subscribers.unsubscribe(chatId);
      this.logger.warn(`Telegram ops chat ${chatId} blocked bot; unsubscribed`);
      return true;
    }

    if (result.errorCode === 429) {
      const waitSec = result.retryAfterSec ?? 1;
      await redis.del(dedupKey);
      await this.sleep(waitSec * 1000);
      return false;
    }

    this.logger.warn(
      `Telegram ops send failed (${result.errorCode}): ${result.description ?? 'unknown'}`,
    );
    return true;
  }

  private async throttle(chatId: string): Promise<void> {
    const globalWait =
      this.minGlobalIntervalMs() - (Date.now() - this.lastGlobalSendMs);
    const chatLast = this.lastChatSendMs.get(chatId) ?? 0;
    const chatWait =
      TELEGRAM_OPS_PER_CHAT_MIN_INTERVAL_MS - (Date.now() - chatLast);
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
