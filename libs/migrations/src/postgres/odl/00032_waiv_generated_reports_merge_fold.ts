import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Persist in-progress mergeRewards fold across generated-report worker batches. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE waiv_generated_reports
    ADD COLUMN merge_reward_fold JSONB
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE waiv_generated_reports
    DROP COLUMN IF EXISTS merge_reward_fold
  `.execute(db);
}
