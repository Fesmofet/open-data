import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Post-cashout reward finalization marker for root posts.
 * @see docs/apps/chain-indexer/spec/waiv-post-reward.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE posts
      ADD COLUMN rewards_finalized_at TIMESTAMPTZ NULL
  `.execute(db);

  await sql`
    CREATE INDEX idx_posts_rewards_finalize_pending
    ON posts (cashout_time)
    WHERE (depth = 0 OR depth IS NULL) AND rewards_finalized_at IS NULL
  `.execute(db);

  await sql`
    UPDATE posts
    SET rewards_finalized_at = cashout_time::timestamptz
    WHERE (depth = 0 OR depth IS NULL)
      AND cashout_time IS NOT NULL
      AND cashout_time::timestamptz < NOW()
      AND rewards_finalized_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_posts_rewards_finalize_pending`.execute(db);
  await sql`
    ALTER TABLE posts
      DROP COLUMN IF EXISTS rewards_finalized_at
  `.execute(db);
}
