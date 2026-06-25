import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Legacy tribaldex swap backfill omitted refHiveBlockNumber; allow NULL for Mongo import.
 * @see docs/apps/chain-indexer/spec/hive-engine-swaps.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE hive_engine_swaps
      ALTER COLUMN ref_hive_block_number DROP NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE hive_engine_swaps
      ALTER COLUMN ref_hive_block_number SET NOT NULL
  `.execute(db);
}
