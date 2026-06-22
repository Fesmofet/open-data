import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * HP vesting delegations and RC delegations indexed from Hive chain (legacy Mongo: delegations, user_rc_delegations).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE user_delegations (
      delegator       TEXT NOT NULL,
      delegatee       TEXT NOT NULL,
      vesting_shares  DOUBLE PRECISION NOT NULL DEFAULT 0,
      delegation_date TIMESTAMPTZ,
      PRIMARY KEY (delegator, delegatee)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_user_delegations_delegatee
    ON user_delegations (delegatee)
  `.execute(db);

  await sql`
    CREATE INDEX idx_user_delegations_delegator
    ON user_delegations (delegator)
  `.execute(db);

  await sql`
    CREATE TABLE user_rc_delegations (
      delegator TEXT NOT NULL,
      delegatee TEXT NOT NULL,
      rc        BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (delegator, delegatee)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_user_rc_delegations_delegatee
    ON user_rc_delegations (delegatee)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_user_rc_delegations_delegatee`.execute(db);
  await sql`DROP TABLE IF EXISTS user_rc_delegations`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_delegations_delegator`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_delegations_delegatee`.execute(db);
  await sql`DROP TABLE IF EXISTS user_delegations`.execute(db);
}
