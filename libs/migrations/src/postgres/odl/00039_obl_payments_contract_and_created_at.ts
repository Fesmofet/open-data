import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Drop payments↔contract link; add block-timestamp created_at to on-chain OBL tables.
 * @see docs/spec/obl/payments.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE obl_payments DROP COLUMN IF EXISTS contract_id`.execute(db);

  const tables = [
    'obl_offers',
    'obl_contracts',
    'obl_invoices',
    'obl_payments',
    'obl_disputes',
  ] as const;

  for (const table of tables) {
    await sql`
      ALTER TABLE ${sql.table(table)}
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `.execute(db);
  }
}

export async function down(db: Kysely<unknown>): Promise<void> {
  const tables = [
    'obl_disputes',
    'obl_payments',
    'obl_invoices',
    'obl_contracts',
    'obl_offers',
  ] as const;

  for (const table of tables) {
    await sql`ALTER TABLE ${sql.table(table)} DROP COLUMN IF EXISTS created_at`.execute(db);
  }

  await sql`
    ALTER TABLE obl_payments ADD COLUMN IF NOT EXISTS contract_id TEXT
  `.execute(db);
}
