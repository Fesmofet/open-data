import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** One-line agent summary per indexed knowledge file. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE knowledge_files ADD COLUMN description TEXT`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE knowledge_files DROP COLUMN IF EXISTS description`.execute(db);
}
