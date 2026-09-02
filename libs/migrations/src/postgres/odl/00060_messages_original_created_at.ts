import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Optional original publish time for object activity messages (display metadata).
 * `updated_at_unix` is reserved for future message editing — unused until edit support lands.
 * @see docs/spec/data-model/messages.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE messages
      ADD COLUMN original_created_at_unix BIGINT,
      ADD COLUMN updated_at_unix BIGINT
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE messages
      DROP COLUMN IF EXISTS updated_at_unix,
      DROP COLUMN IF EXISTS original_created_at_unix
  `.execute(db);
}
