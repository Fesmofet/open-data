import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Server-side read receipts for OSL messaging (not on-chain).
 * @see docs/apps/query-api/spec/osl-messaging.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE channel_members
      ADD COLUMN IF NOT EXISTS last_read_at_unix BIGINT
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE channel_members
      DROP COLUMN IF EXISTS last_read_at_unix
  `.execute(db);
}
