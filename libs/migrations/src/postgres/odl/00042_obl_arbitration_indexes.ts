import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Indexes for OBL arbiter dispute inbox queries. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_contracts_arbiter
    ON obl_contracts (arbiter)
    WHERE dispute_rule = 'arbiter'
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_obl_disputes_status_created
    ON obl_disputes (status, created_event_seq DESC, dispute_id DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_obl_disputes_status_created`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_contracts_arbiter`.execute(db);
}
