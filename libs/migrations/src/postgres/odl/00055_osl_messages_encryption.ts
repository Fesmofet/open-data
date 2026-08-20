import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * OSL message encryption columns (first-class fields, not JSON in body).
 * @see docs/spec/data-model/messages.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE messages
      ADD COLUMN encrypted_body   TEXT,
      ADD COLUMN encryption_mode  TEXT,
      ADD COLUMN encrypted_to     TEXT,
      ADD COLUMN encryption_v     SMALLINT,
      ADD COLUMN encryption_meta  JSONB
  `.execute(db);

  await sql`
    ALTER TABLE messages
      DROP CONSTRAINT chk_messages_body_or_overflow,
      ADD CONSTRAINT chk_messages_payload_present CHECK (
        body IS NOT NULL OR overflow_ref IS NOT NULL OR encrypted_body IS NOT NULL
      ),
      ADD CONSTRAINT chk_messages_encryption_consistent CHECK (
        (encrypted_body IS NULL AND encryption_mode IS NULL
          AND encrypted_to IS NULL AND encryption_v IS NULL)
        OR
        (encrypted_body IS NOT NULL AND encryption_mode IS NOT NULL
          AND encrypted_to IS NOT NULL AND encryption_v IS NOT NULL)
      ),
      ADD CONSTRAINT chk_messages_body_xor_encrypted CHECK (
        NOT (body IS NOT NULL AND encrypted_body IS NOT NULL)
      )
  `.execute(db);

  await sql`
    CREATE INDEX idx_messages_encrypted_to
    ON messages (encrypted_to, created_at_unix DESC)
    WHERE encrypted_to IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_messages_encrypted_to`.execute(db);

  await sql`
    ALTER TABLE messages
      DROP CONSTRAINT IF EXISTS chk_messages_body_xor_encrypted,
      DROP CONSTRAINT IF EXISTS chk_messages_encryption_consistent,
      DROP CONSTRAINT IF EXISTS chk_messages_payload_present,
      ADD CONSTRAINT chk_messages_body_or_overflow CHECK (
        body IS NOT NULL OR overflow_ref IS NOT NULL
      )
  `.execute(db);

  await sql`
    ALTER TABLE messages
      DROP COLUMN IF EXISTS encryption_meta,
      DROP COLUMN IF EXISTS encryption_v,
      DROP COLUMN IF EXISTS encrypted_to,
      DROP COLUMN IF EXISTS encryption_mode,
      DROP COLUMN IF EXISTS encrypted_body
  `.execute(db);
}
