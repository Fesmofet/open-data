import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Split object_authority into object_favorite + object_ownership (testnet cutover; no backfill). */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS object_authority CASCADE`.execute(db);

  await sql`
    CREATE TABLE object_favorite (
      object_id   TEXT NOT NULL REFERENCES objects_core (object_id) ON DELETE CASCADE,
      account     TEXT NOT NULL,
      event_seq   BIGINT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (object_id, account)
    )
  `.execute(db);

  await sql`
    CREATE TABLE object_ownership (
      object_id       TEXT NOT NULL REFERENCES objects_core (object_id) ON DELETE CASCADE,
      account         TEXT NOT NULL,
      ownership_type  TEXT NOT NULL CHECK (ownership_type IN ('exclusive', 'supervised')),
      event_seq       BIGINT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (object_id, account)
    )
  `.execute(db);

  await sql`CREATE INDEX idx_object_favorite_account ON object_favorite (account)`.execute(db);
  await sql`CREATE INDEX idx_object_favorite_object_id ON object_favorite (object_id)`.execute(db);

  await sql`CREATE INDEX idx_object_ownership_account ON object_ownership (account)`.execute(db);
  await sql`
    CREATE INDEX idx_object_ownership_object_id_type
    ON object_ownership (object_id, ownership_type)
  `.execute(db);
  await sql`
    CREATE INDEX idx_object_ownership_object_id_type_created_at
    ON object_ownership (object_id, ownership_type, created_at DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS object_ownership`.execute(db);
  await sql`DROP TABLE IF EXISTS object_favorite`.execute(db);

  await sql`
    CREATE TABLE object_authority (
      object_id       TEXT NOT NULL REFERENCES objects_core (object_id) ON DELETE CASCADE,
      account         TEXT NOT NULL,
      authority_type  TEXT NOT NULL CHECK (authority_type IN ('ownership', 'administrative')),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (object_id, account, authority_type)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_object_authority_object_id_authority_type
    ON object_authority (object_id, authority_type)
  `.execute(db);
  await sql`CREATE INDEX idx_object_authority_account ON object_authority (account)`.execute(db);
  await sql`
    CREATE INDEX idx_object_authority_object_id_type_created_at
    ON object_authority (object_id, authority_type, created_at DESC)
  `.execute(db);
}
