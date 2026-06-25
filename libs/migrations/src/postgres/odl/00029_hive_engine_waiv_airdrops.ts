import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Historical one-time WAIV airdrops (Mongo import only; no live indexer).
 * @see docs/spec/data-model/hive-engine-waiv-airdrops.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE hive_engine_waiv_airdrops (
      id                      BIGSERIAL PRIMARY KEY,
      account                 TEXT NOT NULL,
      transaction_id          TEXT NOT NULL,
      block_number            INTEGER NOT NULL,
      ref_hive_block_number   INTEGER NOT NULL,
      block_timestamp         TIMESTAMPTZ NOT NULL,
      quantity                TEXT NOT NULL,
      token_state             TEXT NOT NULL,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (transaction_id, account)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_hewa_account_ts_id
    ON hive_engine_waiv_airdrops (account, block_timestamp DESC, id DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_hewa_account_ts_id`.execute(db);
  await sql`DROP TABLE IF EXISTS hive_engine_waiv_airdrops`.execute(db);
}
