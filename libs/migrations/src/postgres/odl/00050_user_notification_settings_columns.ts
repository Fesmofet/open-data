import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Notification settings column cleanup and new object/thread toggles.
 * @see docs/spec/data-model/users.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_notification_settings
      DROP COLUMN IF EXISTS activation_campaign,
      DROP COLUMN IF EXISTS status_change
  `.execute(db);

  await sql`
    ALTER TABLE user_notification_settings
      ADD COLUMN IF NOT EXISTS claimed_object_updates BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS group_id_control BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS followed_user_threads BOOLEAN NOT NULL DEFAULT TRUE
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_notification_settings
      DROP COLUMN IF EXISTS claimed_object_updates,
      DROP COLUMN IF EXISTS group_id_control,
      DROP COLUMN IF EXISTS followed_user_threads,
      ADD COLUMN IF NOT EXISTS activation_campaign BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS status_change BOOLEAN NOT NULL DEFAULT TRUE
  `.execute(db);
}
