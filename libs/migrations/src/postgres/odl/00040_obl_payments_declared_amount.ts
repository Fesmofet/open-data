import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Preserve original declared amount on partial payment_confirm.
 * @see docs/spec/obl/payments.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_payments
    ADD COLUMN declared_amount_usd NUMERIC(20,8)
  `.execute(db);

  await sql`
    UPDATE obl_payments
    SET declared_amount_usd = amount_usd
  `.execute(db);

  await sql`
    ALTER TABLE obl_payments
    ALTER COLUMN declared_amount_usd SET NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_payments
    DROP COLUMN IF EXISTS declared_amount_usd
  `.execute(db);
}
