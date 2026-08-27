import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Btree prefix indexes on JSON identifier value and address locality for predictive search
 * (`lower(value_json->>'…') >= prefix AND < upper` or `LIKE prefix%`).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_object_updates_identifier_value_lower
    ON object_updates (lower(value_json->>'value') text_pattern_ops)
    WHERE update_type = 'identifier' AND value_json->>'value' IS NOT NULL
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_object_updates_address_locality_lower
    ON object_updates (lower(value_json->>'locality') text_pattern_ops)
    WHERE update_type = 'address' AND value_json->>'locality' IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_object_updates_address_locality_lower`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS idx_object_updates_identifier_value_lower`.execute(
    db,
  );
}
