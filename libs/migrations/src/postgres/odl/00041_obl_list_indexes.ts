import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Indexes for OBL list/pagination queries. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_contracts_provider
    ON obl_contracts (provider)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_contracts_client
    ON obl_contracts (client)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_payments_pair_created
    ON obl_payments (pair_low, pair_high, created_event_seq DESC, payment_id DESC)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_invoices_pair_created
    ON obl_invoices (pair_low, pair_high, created_event_seq DESC, invoice_id DESC)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_contracts_pair_created
    ON obl_contracts (pair_low, pair_high, created_event_seq DESC, contract_id DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_obl_contracts_pair_created`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_invoices_pair_created`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_payments_pair_created`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_contracts_client`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_contracts_provider`.execute(db);
}
