import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  renderSystemHealthReport,
  SystemHealthCheckService,
} from '@opden-data-layer/system-alerts';
import { randomUUID } from 'crypto';
import {
  TELEGRAM_OPS_POLLER_LOCK_TTL_SEC,
  TELEGRAM_OPS_POLLER_LOCK_VALUE_PREFIX,
  telegramOpsPollerLockKey,
} from './telegram-ops.constants';
import { OpsTelegramSubscribersRepository } from '../repositories/ops-telegram-subscribers.repository';
import { TelegramApiClient } from '../telegram/telegram-api.client';
import {
  opsHelpMessage,
  opsStartMessage,
  opsUnknownCommandMessage,
} from './ops-views';

@Injectable()
export class TelegramOpsPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramOpsPollerService.name);
  private running = false;
  private loopPromise: Promise<void> | null = null;
  private updateOffset: number | undefined;
  private readonly lockToken = `${TELEGRAM_OPS_POLLER_LOCK_VALUE_PREFIX}${randomUUID()}`;

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
    private readonly api: TelegramApiClient,
    private readonly subscribers: OpsTelegramSubscribersRepository,
    private readonly health: SystemHealthCheckService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.api.isConfigured()) {
      return;
    }
    this.running = true;
    this.loopPromise = this.pollLoop();
    this.logger.log('Telegram ops poller started');
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise;
    }
    const redis = this.redisFactory.getClient();
    await redis.releaseLockIfValue(
      telegramOpsPollerLockKey(),
      this.lockToken,
    );
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      const holdsLock = await this.ensurePollerLock();
      if (!holdsLock) {
        await this.sleep(5000);
        continue;
      }
      const timeoutSec =
        this.config.get<number>('telegram.pollTimeoutSec') ?? 30;
      try {
        const updates = await this.api.getUpdates(
          this.updateOffset,
          timeoutSec,
        );
        for (const update of updates) {
          this.updateOffset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (err) {
        this.logger.error(`Telegram ops poll error: ${(err as Error).message}`);
        await this.sleep(2000);
      }
    }
  }

  private async ensurePollerLock(): Promise<boolean> {
    const redis = this.redisFactory.getClient();
    const key = telegramOpsPollerLockKey();
    const acquired = await redis.trySetNx(
      key,
      this.lockToken,
      TELEGRAM_OPS_POLLER_LOCK_TTL_SEC,
    );
    if (acquired) {
      return true;
    }
    const current = await redis.get(key);
    if (current === this.lockToken) {
      await redis.set(key, this.lockToken, TELEGRAM_OPS_POLLER_LOCK_TTL_SEC);
      return true;
    }
    return false;
  }

  private async handleUpdate(update: {
    message?: { chat: { id: number }; text?: string };
  }): Promise<void> {
    const message = update.message;
    if (!message?.text) {
      return;
    }
    const chatId = String(message.chat.id);
    const text = message.text.trim();
    if (text.length === 0) {
      return;
    }

    const lower = text.toLowerCase();
    if (lower.startsWith('/start')) {
      await this.subscribers.subscribe(chatId);
      await this.api.sendMessage(chatId, opsStartMessage());
      return;
    }
    if (lower === '/help' || lower.startsWith('/help ')) {
      await this.api.sendMessage(chatId, opsHelpMessage());
      return;
    }
    if (lower === '/status' || lower.startsWith('/status ')) {
      try {
        const report = await this.health.check();
        await this.api.sendMessage(chatId, renderSystemHealthReport(report));
      } catch (err) {
        this.logger.error(`/status failed: ${(err as Error).message}`);
        await this.api.sendMessage(
          chatId,
          'Health check failed. Try again later or check service logs.',
        );
      }
      return;
    }
    if (lower.startsWith('/')) {
      await this.api.sendMessage(chatId, opsUnknownCommandMessage());
      return;
    }
    await this.api.sendMessage(chatId, opsHelpMessage());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
