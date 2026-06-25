import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Remove unused pool_id from hive_engine_swaps (never populated in legacy data). */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE hive_engine_swaps
      DROP COLUMN IF EXISTS pool_id
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE hive_engine_swaps
      ADD COLUMN IF NOT EXISTS pool_id INTEGER NULL
  `.execute(db);
}
