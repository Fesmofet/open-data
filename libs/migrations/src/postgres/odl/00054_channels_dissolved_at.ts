import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Soft-dissolve group channels when the last member leaves.
 * @see docs/spec/osl/channels.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE channels
    ADD COLUMN dissolved_at_unix BIGINT NULL
  `.execute(db);

  await sql`
    CREATE INDEX idx_channels_active_last_message_at
    ON channels (last_message_at_unix DESC NULLS LAST)
    WHERE dissolved_at_unix IS NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_channels_active_last_message_at`.execute(db);
  await sql`ALTER TABLE channels DROP COLUMN IF EXISTS dissolved_at_unix`.execute(db);
}
