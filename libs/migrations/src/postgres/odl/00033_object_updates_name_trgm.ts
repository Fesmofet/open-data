import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Trigram GIN index on `object_updates.value_text_normalized` (name/title only) so predictive
 * search can boost objects whose display name/title starts with the full typed query
 * (including stopwords like "about"), which the `english` FTS `search_vector` strips.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_object_updates_name_title_value_norm_trgm
    ON object_updates USING GIN (value_text_normalized gin_trgm_ops)
    WHERE update_type IN ('name', 'title') AND value_text_normalized IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_object_updates_name_title_value_norm_trgm`.execute(
    db,
  );
}
