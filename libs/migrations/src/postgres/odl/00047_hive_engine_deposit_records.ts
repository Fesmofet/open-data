import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Hive Engine deposit instructions (OSL hive_engine_deposit + legacy Mongo import).
 * @see docs/spec/data-model/hive-engine-deposit-records.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE hive_engine_deposit_records (
      id                      BIGSERIAL PRIMARY KEY,
      account                 TEXT NOT NULL,
      transaction_id          TEXT NOT NULL,
      ref_hive_block_number   INTEGER NOT NULL,
      block_timestamp         TIMESTAMPTZ NOT NULL,
      destination             TEXT NOT NULL,
      symbol_in               TEXT NOT NULL,
      symbol_out              TEXT NOT NULL,
      pair                    TEXT NOT NULL,
      ex_rate                 DOUBLE PRECISION NOT NULL,
      deposit_account         TEXT,
      address                 TEXT,
      memo                    TEXT,
      symbols                 TEXT[] GENERATED ALWAYS AS (ARRAY[symbol_in, symbol_out]) STORED,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (transaction_id, account)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_hedr_account_ts_id
    ON hive_engine_deposit_records (account, block_timestamp DESC, id DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_hedr_symbols_gin
    ON hive_engine_deposit_records USING GIN (symbols)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_hedr_symbols_gin`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_hedr_account_ts_id`.execute(db);
  await sql`DROP TABLE IF EXISTS hive_engine_deposit_records`.execute(db);
}
