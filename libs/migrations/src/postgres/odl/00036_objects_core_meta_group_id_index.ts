import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Partial index for variant options sibling lookup by meta_group_id.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX idx_objects_core_meta_group_id_active
    ON objects_core (meta_group_id)
    WHERE status = 'active' AND meta_group_id IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_objects_core_meta_group_id_active`.execute(db);
}
