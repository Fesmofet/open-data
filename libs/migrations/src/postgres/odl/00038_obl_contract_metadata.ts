import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * OBL contract metadata + one contract per offer/pair.
 * @see docs/spec/obl/contracts.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_contracts
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX uniq_obl_contracts_offer_pair
    ON obl_contracts (offer_id, pair_low, pair_high)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS uniq_obl_contracts_offer_pair`.execute(db);
  await sql`ALTER TABLE obl_contracts DROP COLUMN IF EXISTS metadata`.execute(db);
}
