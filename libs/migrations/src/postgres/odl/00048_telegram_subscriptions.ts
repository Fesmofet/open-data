import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Telegram bot chat ↔ Hive account subscriptions for notifications channel.
 * @see docs/apps/notifications/spec/telegram-channel.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE telegram_subscriptions (
      chat_id    BIGINT NOT NULL,
      account    TEXT NOT NULL REFERENCES accounts_current (name) ON DELETE CASCADE,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (chat_id, account)
    )
  `.execute(db);

  await sql`
    CREATE INDEX telegram_subscriptions_account_idx
    ON telegram_subscriptions (account)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS telegram_subscriptions_account_idx`.execute(db);
  await sql`DROP TABLE IF EXISTS telegram_subscriptions`.execute(db);
}
