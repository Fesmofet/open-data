import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { randomUUID } from 'crypto';
import {
  TELEGRAM_MAX_ACCOUNTS_PER_CHAT,
  TELEGRAM_POLLER_LOCK_TTL_SEC,
  TELEGRAM_POLLER_LOCK_VALUE_PREFIX,
  telegramPollerLockKey,
} from '../constants/telegram.constants';
import { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';
import { TelegramApiClient } from './telegram-api.client';
import { TelegramSubscriptionsCacheService } from './telegram-subscriptions-cache.service';
import { planChatSubscriptions } from './telegram-subscribe-limit';

@Injectable()
export class TelegramPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPollerService.name);
  private running = false;
  private loopPromise: Promise<void> | null = null;
  private updateOffset: number | undefined;
  private readonly lockToken = `${TELEGRAM_POLLER_LOCK_VALUE_PREFIX}${randomUUID()}`;

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
    this.running = true;
    this.loopPromise = this.pollLoop();
    this.logger.log('Telegram poller started');
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise;
    }
    const redis = this.redisFactory.getClient();
    await redis.releaseLockIfValue(telegramPollerLockKey(), this.lockToken);
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
        this.logger.error(`Telegram poll error: ${(err as Error).message}`);
        await this.sleep(2000);
      }
    }
  }

  private async ensurePollerLock(): Promise<boolean> {
    const redis = this.redisFactory.getClient();
    const key = telegramPollerLockKey();
    const acquired = await redis.trySetNx(
      key,
      this.lockToken,
      TELEGRAM_POLLER_LOCK_TTL_SEC,
    );
    if (acquired) {
      return true;
    }
    const current = await redis.get(key);
    if (current === this.lockToken) {
      await redis.set(key, this.lockToken, TELEGRAM_POLLER_LOCK_TTL_SEC);
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
      const names = this.parseUsernames(text.slice('/start'.length));
      await this.subscribeMany(chatId, names);
      return;
    }
    if (lower.startsWith('/stop')) {
      const names = this.parseUsernames(text.slice('/stop'.length));
      if (names.length === 0) {
        const accounts =
          await this.subscriptions.findAccountsByChatId(chatId);
        await this.subscriptions.unsubscribe(chatId);
        for (const account of accounts) {
          await this.subscriptionsCache.invalidate(account);
        }
        await this.api.sendMessage(
          chatId,
          'Unsubscribed from all Hive accounts on this chat.',
        );
        return;
      }
      for (const name of names) {
        await this.subscriptions.unsubscribe(chatId, name);
        await this.subscriptionsCache.invalidate(name);
      }
      await this.api.sendMessage(chatId, `Unsubscribed: ${names.join(', ')}`);
      return;
    }
    if (lower === '/list') {
      const accounts = await this.subscriptions.findAccountsByChatId(chatId);
      if (accounts.length === 0) {
        await this.api.sendMessage(
          chatId,
          'No Hive accounts subscribed. Send /start yourname or type your Hive username.',
        );
        return;
      }
      await this.api.sendMessage(
        chatId,
        `Subscribed accounts:\n${accounts.map((a) => `• ${a}`).join('\n')}`,
      );
      return;
    }
    if (lower.startsWith('/')) {
      await this.api.sendMessage(
        chatId,
        'Commands: /start [username...], /stop [username...], /list',
      );
      return;
    }

    const names = this.parseUsernames(text);
    await this.subscribeMany(chatId, names);
  }

  private async subscribeMany(chatId: string, names: string[]): Promise<void> {
    if (names.length === 0) {
      await this.api.sendMessage(
        chatId,
        'Send your Hive username(s), e.g. /start alice',
      );
      return;
    }
    const ok: string[] = [];
    const missing: string[] = [];
    const current = await this.subscriptions.findAccountsByChatId(chatId);
    const { namesToSubscribe, limitRejected } = planChatSubscriptions(
      current,
      names,
      TELEGRAM_MAX_ACCOUNTS_PER_CHAT,
    );
    for (const name of namesToSubscribe) {
      const exists = await this.subscriptions.accountExists(name);
      if (!exists) {
        missing.push(name);
        continue;
      }
      const saved = await this.subscriptions.subscribe(chatId, name);
      if (saved) {
        await this.subscriptionsCache.invalidate(name);
        ok.push(name);
      }
    }
    const lines: string[] = [];
    if (ok.length > 0) {
      lines.push(`Subscribed: ${ok.join(', ')}`);
    }
    if (missing.length > 0) {
      lines.push(`Unknown Hive account(s): ${missing.join(', ')}`);
    }
    if (limitRejected.length > 0) {
      lines.push(
        `Limit reached (${TELEGRAM_MAX_ACCOUNTS_PER_CHAT} accounts). Not added: ${limitRejected.join(', ')}. Use /stop <username> to free a slot.`,
      );
    }
    if (lines.length === 0) {
      lines.push('Nothing changed.');
    }
    await this.api.sendMessage(chatId, lines.join('\n'));
  }

  private parseUsernames(raw: string): string[] {
    return raw
      .split(/[\s,]+/)
      .map((s) => s.trim().replace(/^@/, '').toLowerCase())
      .filter((s) => s.length > 0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
