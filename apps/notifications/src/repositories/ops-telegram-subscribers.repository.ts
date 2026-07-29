import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/core';
import { KYSELY } from '../database';

type DbExecutor = Kysely<OdlDatabase>;

@Injectable()
export class OpsTelegramSubscribersRepository {
  private readonly logger = new Logger(OpsTelegramSubscribersRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<OdlDatabase>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async findAllChatIds(): Promise<string[]> {
    try {
      const rows = await this.db
        .selectFrom('ops_telegram_subscribers')
        .select('chat_id')
        .execute();
      return rows.map((r) => String(r.chat_id));
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async subscribe(chatId: string): Promise<boolean> {
    const trimmedChatId = chatId.trim();
    if (trimmedChatId.length === 0) {
      return false;
    }
    try {
      await this.db
        .insertInto('ops_telegram_subscribers')
        .values({
          chat_id: trimmedChatId,
          created_at: Date.now(),
        })
        .onConflict((oc) => oc.column('chat_id').doNothing())
        .execute();
      return true;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async unsubscribe(chatId: string): Promise<void> {
    const trimmedChatId = chatId.trim();
    if (trimmedChatId.length === 0) {
      return;
    }
    try {
      await this.db
        .deleteFrom('ops_telegram_subscribers')
        .where('chat_id', '=', trimmedChatId)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
    }
  }
}
