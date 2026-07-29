import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Ops Telegram bot subscribers (system alerts).
 * @see docs/apps/notifications/spec/telegram-ops-bot.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE ops_telegram_subscribers (
      chat_id    BIGINT NOT NULL PRIMARY KEY,
      created_at BIGINT NOT NULL
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS ops_telegram_subscribers`.execute(db);
}
