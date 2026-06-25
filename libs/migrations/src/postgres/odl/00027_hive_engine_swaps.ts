import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Atomic Hive Engine market-pool swaps (symbolIn/Out from transaction logs).
 * @see docs/apps/chain-indexer/spec/hive-engine-swaps.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE hive_engine_swaps (
      id                      BIGSERIAL PRIMARY KEY,
      account                 TEXT NOT NULL,
      transaction_id          TEXT NOT NULL,
      block_number            INTEGER NOT NULL,
      ref_hive_block_number   INTEGER NOT NULL,
      block_timestamp         TIMESTAMPTZ NOT NULL,
      symbol_out              TEXT NOT NULL,
      symbol_in               TEXT NOT NULL,
      symbol_out_quantity     TEXT NOT NULL,
      symbol_in_quantity      TEXT NOT NULL,
      pool_id                 INTEGER NULL,
      symbols                 TEXT[] GENERATED ALWAYS AS (ARRAY[symbol_in, symbol_out]) STORED,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (transaction_id, account)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_hes_account_ts_id
    ON hive_engine_swaps (account, block_timestamp DESC, id DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_hes_symbols_gin
    ON hive_engine_swaps USING GIN (symbols)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_hes_symbols_gin`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_hes_account_ts_id`.execute(db);
  await sql`DROP TABLE IF EXISTS hive_engine_swaps`.execute(db);
}
