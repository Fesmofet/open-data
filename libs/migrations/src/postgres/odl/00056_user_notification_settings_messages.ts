import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * OSL messaging notification toggle (DM + group).
 * @see docs/spec/osl/notifications.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_notification_settings
      ADD COLUMN IF NOT EXISTS messages BOOLEAN NOT NULL DEFAULT TRUE
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_notification_settings
      DROP COLUMN IF EXISTS messages
  `.execute(db);
}
