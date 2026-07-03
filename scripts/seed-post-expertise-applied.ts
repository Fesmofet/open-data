/**
 * Seed posts.expertise_applied_at for historical cashout posts after Mongo import.
 * Prevents scheduler backfill from double-counting expertise already in Mongo aggregates.
 *
 * Usage: pnpm seed:post-expertise-applied
 */

import { resolveConnectionString } from '../libs/migrations/src/connection';
import type { OdlDatabase } from '../libs/core/src/db';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: resolveConnectionString() });
  const db = new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) });

  try {
    const result = await sql<{ count: string }>`
      WITH updated AS (
        UPDATE posts
        SET expertise_applied_at = COALESCE(rewards_finalized_at, NOW())
        WHERE rewards_finalized_at IS NOT NULL
          AND expertise_applied_at IS NULL
        RETURNING 1
      )
      SELECT COUNT(*)::text AS count FROM updated
    `.execute(db);

    const count = result.rows[0]?.count ?? '0';
    console.log(`Seeded expertise_applied_at on ${count} post(s).`);
  } finally {
    await db.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
