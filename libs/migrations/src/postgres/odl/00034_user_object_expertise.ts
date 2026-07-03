import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Per-user per-object expertise weights and post-level idempotency marker.
 * @see docs/apps/scheduler/spec/post-expertise.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE user_object_expertise (
      account    TEXT NOT NULL REFERENCES accounts_current (name) ON DELETE CASCADE,
      object_id  TEXT NOT NULL REFERENCES objects_core (object_id) ON DELETE CASCADE,
      weight     DOUBLE PRECISION NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account, object_id)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_user_object_expertise_account_weight
    ON user_object_expertise (account, weight DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_user_object_expertise_object_id
    ON user_object_expertise (object_id)
  `.execute(db);

  await sql`
    ALTER TABLE posts
      ADD COLUMN expertise_applied_at TIMESTAMPTZ NULL
  `.execute(db);

  await sql`
    CREATE INDEX idx_posts_expertise_backfill_pending
    ON posts (rewards_finalized_at)
    WHERE (depth = 0 OR depth IS NULL)
      AND rewards_finalized_at IS NOT NULL
      AND expertise_applied_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_posts_expertise_backfill_pending`.execute(db);
  await sql`
    ALTER TABLE posts
      DROP COLUMN IF EXISTS expertise_applied_at
  `.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_object_expertise_object_id`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_object_expertise_account_weight`.execute(db);
  await sql`DROP TABLE IF EXISTS user_object_expertise`.execute(db);
}
