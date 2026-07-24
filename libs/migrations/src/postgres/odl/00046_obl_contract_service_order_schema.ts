import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Optional JSON Schema snapshot for service order details, copied from offer terms at contract sign.
 * @see docs/spec/obl/contracts.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_contracts
    ADD COLUMN service_order_schema JSONB
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_contracts
    DROP COLUMN IF EXISTS service_order_schema
  `.execute(db);
}
