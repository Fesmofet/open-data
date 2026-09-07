import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Hive account_auths reverse index (grantor → grantee by authority type). */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE user_account_auths (
      grantor          TEXT NOT NULL,
      authority_type   TEXT NOT NULL CHECK (authority_type IN ('owner', 'active', 'posting')),
      grantee          TEXT NOT NULL,
      updated_at_block BIGINT NOT NULL,
      PRIMARY KEY (grantor, authority_type, grantee)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_user_account_auths_grantee_lookup
    ON user_account_auths (grantee, authority_type, grantor)
  `.execute(db);

  await sql`
    CREATE TABLE user_account_auth_sync (
      account      TEXT PRIMARY KEY,
      synced_at    TIMESTAMPTZ NOT NULL,
      synced_block BIGINT NOT NULL
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS user_account_auth_sync`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_account_auths_grantee_lookup`.execute(db);
  await sql`DROP TABLE IF EXISTS user_account_auths`.execute(db);
}
