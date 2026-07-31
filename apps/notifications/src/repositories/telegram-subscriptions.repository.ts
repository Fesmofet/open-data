import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/core';
import { KYSELY } from '../database';

type DbExecutor = Kysely<OdlDatabase>;

@Injectable()
export class TelegramSubscriptionsRepository {
  private readonly logger = new Logger(TelegramSubscriptionsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<OdlDatabase>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  /** Chat ids grouped by account; accounts without subscriptions are absent from the map. */
  async findChatIdsByAccounts(
    accounts: string[],
  ): Promise<Map<string, string[]>> {
    const trimmed = [
      ...new Set(accounts.map((a) => a.trim()).filter((a) => a.length > 0)),
    ];
    const grouped = new Map<string, string[]>();
    if (trimmed.length === 0) {
      return grouped;
    }
    try {
      const rows = await this.db
        .selectFrom('telegram_subscriptions')
        .select(['account', 'chat_id'])
        .where('account', 'in', trimmed)
        .execute();
      for (const row of rows) {
        const existing = grouped.get(row.account);
        if (existing) {
          existing.push(String(row.chat_id));
          continue;
        }
        grouped.set(row.account, [String(row.chat_id)]);
      }
      return grouped;
    } catch (e) {
      this.logger.error((e as Error).message);
      return grouped;
    }
  }

  async findAccountsByChatId(chatId: string): Promise<string[]> {
    const id = chatId.trim();
    if (id.length === 0) {
      return [];
    }
    try {
      const rows = await this.db
        .selectFrom('telegram_subscriptions')
        .select('account')
        .where('chat_id', '=', id)
        .execute();
      return rows.map((r) => r.account);
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async accountExists(name: string): Promise<boolean> {
    const existing = await this.findExistingAccountNames([name]);
    return existing.has(name.trim());
  }

  async findExistingAccountNames(
    names: readonly string[],
  ): Promise<Set<string>> {
    const trimmed = [
      ...new Set(names.map((n) => n.trim()).filter((n) => n.length > 0)),
    ];
    if (trimmed.length === 0) {
      return new Set();
    }
    try {
      const rows = await this.db
        .selectFrom('accounts_current')
        .select('name')
        .where('name', 'in', trimmed)
        .execute();
      return new Set(rows.map((r) => r.name));
    } catch (e) {
      this.logger.error((e as Error).message);
      return new Set();
    }
  }

  async subscribe(chatId: string, account: string): Promise<boolean> {
    const trimmedAccount = account.trim();
    const trimmedChatId = chatId.trim();
    if (trimmedAccount.length === 0 || trimmedChatId.length === 0) {
      return false;
    }
    try {
      await this.db
        .insertInto('telegram_subscriptions')
        .values({
          chat_id: trimmedChatId,
          account: trimmedAccount,
          created_at: Date.now(),
        })
        .onConflict((oc) => oc.columns(['chat_id', 'account']).doNothing())
        .execute();
      return true;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async unsubscribe(chatId: string, account?: string): Promise<void> {
    const trimmedChatId = chatId.trim();
    if (trimmedChatId.length === 0) {
      return;
    }
    try {
      let query = this.db
        .deleteFrom('telegram_subscriptions')
        .where('chat_id', '=', trimmedChatId);
      if (account !== undefined) {
        const trimmedAccount = account.trim();
        if (trimmedAccount.length === 0) {
          return;
        }
        query = query.where('account', '=', trimmedAccount);
      }
      await query.execute();
    } catch (e) {
      this.logger.error((e as Error).message);
    }
  }
}
