import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Global home feed (guest): newest root posts by created_unix.
 * @see docs/apps/query-api/spec/home-feed.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_posts_root_created_unix
    ON posts (created_unix DESC, author DESC, permlink DESC)
    WHERE depth = 0 OR depth IS NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_posts_root_created_unix`.execute(db);
}
