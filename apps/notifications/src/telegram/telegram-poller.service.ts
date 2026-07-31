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
  TELEGRAM_POLL_DEFAULT_INTERVAL_MS,
  TELEGRAM_POLL_DEFAULT_TIMEOUT_SEC,
  TELEGRAM_POLLER_LOCK_RETRY_MS,
  TELEGRAM_POLLER_LOCK_TTL_SEC,
  TELEGRAM_POLLER_LOCK_VALUE_PREFIX,
  TELEGRAM_SUBSCRIPTION_LIST_EMPTY,
  TELEGRAM_SUBSCRIPTION_LIST_HEADER,
  telegramPollerLockKey,
} from '../constants/telegram.constants';
import { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';
import { TelegramApiClient, type TelegramUpdate } from './telegram-api.client';
import {
  buildSubscriptionListInlineKeyboard,
  parseUnsubscribeCallbackData,
} from './telegram-inline-keyboard';
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
        await this.sleep(TELEGRAM_POLLER_LOCK_RETRY_MS);
        continue;
      }
      const timeoutSec =
        this.config.get<number>('telegram.pollTimeoutSec') ??
        TELEGRAM_POLL_DEFAULT_TIMEOUT_SEC;
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
      const intervalMs =
        this.config.get<number>('telegram.pollIntervalMs') ??
        TELEGRAM_POLL_DEFAULT_INTERVAL_MS;
      if (intervalMs > 0) {
        await this.sleep(intervalMs);
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

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return;
    }

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
        await this.subscriptions.unsubscribe(chatId);
        await this.api.sendMessage(
          chatId,
          'Unsubscribed from all Hive accounts on this chat.',
        );
        return;
      }
      for (const name of names) {
        await this.subscriptions.unsubscribe(chatId, name);
      }
      await this.api.sendMessage(chatId, `Unsubscribed: ${names.join(', ')}`);
      return;
    }
    if (lower === '/list') {
      await this.sendSubscriptionList(chatId);
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

  private async handleCallbackQuery(
    query: NonNullable<TelegramUpdate['callback_query']>,
  ): Promise<void> {
    await this.api.answerCallbackQuery(query.id);
    const chatId = query.message?.chat.id;
    const data = query.data?.trim();
    if (chatId === undefined || !data) {
      return;
    }
    const account = parseUnsubscribeCallbackData(data);
    if (!account) {
      return;
    }
    await this.subscriptions.unsubscribe(String(chatId), account);
    await this.sendSubscriptionList(String(chatId));
  }

  private webPublicOrigin(): string {
    return (
      this.config.get<string>('telegram.webPublicOrigin') ??
      'http://localhost:3000'
    );
  }

  private async sendSubscriptionList(chatId: string): Promise<void> {
    const accounts = await this.subscriptions.findAccountsByChatId(chatId);
    if (accounts.length === 0) {
      await this.api.sendMessage(chatId, TELEGRAM_SUBSCRIPTION_LIST_EMPTY);
      return;
    }
    const replyMarkup = buildSubscriptionListInlineKeyboard(
      accounts,
      this.webPublicOrigin(),
    );
    await this.api.sendMessage(chatId, TELEGRAM_SUBSCRIPTION_LIST_HEADER, {
      replyMarkup,
    });
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
      await this.subscriptions.subscribe(chatId, name);
      ok.push(name);
    }
    if (missing.length > 0) {
      await this.api.sendMessage(
        chatId,
        `Unknown Hive account(s): ${missing.join(', ')}`,
      );
    }
    if (limitRejected.length > 0) {
      await this.api.sendMessage(
        chatId,
        `Limit reached (${TELEGRAM_MAX_ACCOUNTS_PER_CHAT} accounts). Not added: ${limitRejected.join(', ')}. Use /stop <username> to free a slot.`,
      );
    }
    if (ok.length > 0) {
      await this.sendSubscriptionList(chatId);
      return;
    }
    if (missing.length === 0 && limitRejected.length === 0) {
      await this.api.sendMessage(chatId, 'Nothing changed.');
    }
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
