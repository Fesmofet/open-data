import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Favorites visibility: when true, exclude post-linked objects from favorites scope.
 * @see docs/apps/query-api/spec/users-favorites-endpoint.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_metadata
      ADD COLUMN IF NOT EXISTS hide_favorite_objects BOOLEAN NOT NULL DEFAULT FALSE
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE user_metadata
      DROP COLUMN IF EXISTS hide_favorite_objects
  `.execute(db);
}
