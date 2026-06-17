import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Index for shop/favorites queries filtering post_objects by author.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_post_objects_author
    ON post_objects (author)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_post_objects_author`.execute(db);
}
