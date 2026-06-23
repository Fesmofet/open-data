import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Per-viewer advanced report row exemptions (legacy Mongo wallet_exemptions). */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE wallet_exemptions (
      viewer           TEXT NOT NULL,
      account          TEXT NOT NULL,
      operation_index  INTEGER NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (viewer, account, operation_index)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_wallet_exemptions_viewer_account
    ON wallet_exemptions (viewer, account)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_wallet_exemptions_viewer_account`.execute(db);
  await sql`DROP TABLE IF EXISTS wallet_exemptions`.execute(db);
}
