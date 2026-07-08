import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Scheduler snapshots SWAP.* USD crosses (5m); query-api reads only Postgres. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE hive_engine_swap_pool_usd (
      symbol     TEXT PRIMARY KEY,
      usd        NUMERIC(18, 8) NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS hive_engine_swap_pool_usd`.execute(db);
}
