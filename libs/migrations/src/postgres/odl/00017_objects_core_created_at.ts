import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Object creation time for discover newest/oldest sort. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE objects_core
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `.execute(db);

  await sql`
    CREATE INDEX idx_objects_core_type_created_at
    ON objects_core (object_type, created_at DESC)
    WHERE status = 'active'
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_objects_core_type_created_at`.execute(db);
  await sql`ALTER TABLE objects_core DROP COLUMN IF EXISTS created_at`.execute(db);
}
