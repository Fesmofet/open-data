import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Add `closed` and `privacy_erasure` to objects_core.status CHECK. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE objects_core
      DROP CONSTRAINT IF EXISTS objects_core_status_check
  `.execute(db);

  await sql`
    ALTER TABLE objects_core
      ADD CONSTRAINT objects_core_status_check
      CHECK (status IN (
        'active',
        'relisted',
        'unavailable',
        'closed',
        'privacy_erasure',
        'nsfw',
        'flagged'
      ))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE objects_core
      DROP CONSTRAINT IF EXISTS objects_core_status_check
  `.execute(db);

  await sql`
    ALTER TABLE objects_core
      ADD CONSTRAINT objects_core_status_check
      CHECK (status IN ('active', 'relisted', 'unavailable', 'nsfw', 'flagged'))
  `.execute(db);
}
