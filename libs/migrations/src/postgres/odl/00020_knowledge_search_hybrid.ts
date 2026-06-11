import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Hybrid search: pg_trgm + routing_text on knowledge_files. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  await sql`
    ALTER TABLE knowledge_files
    ADD COLUMN IF NOT EXISTS routing_text TEXT
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS knowledge_files_title_trgm_idx
    ON knowledge_files USING GIN (title gin_trgm_ops)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS knowledge_files_description_trgm_idx
    ON knowledge_files USING GIN (description gin_trgm_ops)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS knowledge_files_path_trgm_idx
    ON knowledge_files USING GIN (path gin_trgm_ops)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS knowledge_files_routing_text_trgm_idx
    ON knowledge_files USING GIN (routing_text gin_trgm_ops)
  `.execute(db);

  await sql`
    UPDATE knowledge_files
    SET routing_text = trim(
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(path, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
    WHERE routing_text IS NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS knowledge_files_routing_text_trgm_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS knowledge_files_path_trgm_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS knowledge_files_description_trgm_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS knowledge_files_title_trgm_idx`.execute(db);
  await sql`ALTER TABLE knowledge_files DROP COLUMN IF EXISTS routing_text`.execute(db);
}
