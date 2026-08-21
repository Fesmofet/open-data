import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Profile feed read cursors + reply event tables for unread tab badges.
 * @see docs/apps/query-api/spec/feed-unread-counts.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_metadata
      ADD COLUMN IF NOT EXISTS profile_posts_last_read_at_unix BIGINT,
      ADD COLUMN IF NOT EXISTS profile_threads_last_read_at_unix BIGINT
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS post_replies (
      author TEXT NOT NULL,
      permlink TEXT NOT NULL,
      root_author TEXT NOT NULL,
      root_permlink TEXT NOT NULL,
      parent_author TEXT NOT NULL,
      parent_permlink TEXT NOT NULL,
      created_unix BIGINT NOT NULL,
      PRIMARY KEY (author, permlink)
    )
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_post_replies_root_created
      ON post_replies (root_author, created_unix DESC)
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS thread_replies (
      author TEXT NOT NULL,
      permlink TEXT NOT NULL,
      parent_author TEXT NOT NULL,
      parent_permlink TEXT NOT NULL,
      created_unix BIGINT NOT NULL,
      PRIMARY KEY (author, permlink)
    )
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_thread_replies_parent_created
      ON thread_replies (parent_author, parent_permlink, created_unix DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_thread_replies_parent_created`.execute(db);
  await sql`DROP TABLE IF EXISTS thread_replies`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_post_replies_root_created`.execute(db);
  await sql`DROP TABLE IF EXISTS post_replies`.execute(db);
  await sql`
    ALTER TABLE user_metadata
      DROP COLUMN IF EXISTS profile_posts_last_read_at_unix,
      DROP COLUMN IF EXISTS profile_threads_last_read_at_unix
  `.execute(db);
}
