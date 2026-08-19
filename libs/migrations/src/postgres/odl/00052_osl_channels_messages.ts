import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * OSL messaging: channels, members, aliases, messages, tombstones, context exclusions.
 * @see docs/spec/data-model/messages.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE channels (
      channel_id              TEXT NOT NULL PRIMARY KEY,
      kind                    TEXT NOT NULL,
      creator                 TEXT NOT NULL,
      title                   TEXT,
      image                   JSONB,
      object_id               TEXT REFERENCES objects_core (object_id),
      pair_hash               TEXT,
      access                  TEXT NOT NULL DEFAULT 'members_only',
      last_message_at_unix    BIGINT,
      created_at_unix         BIGINT NOT NULL,
      event_seq               BIGINT NOT NULL,
      transaction_id          TEXT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX uq_channels_direct_pair_hash
    ON channels (pair_hash)
    WHERE kind = 'direct' AND pair_hash IS NOT NULL
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX uq_channels_object_kind
    ON channels (object_id)
    WHERE kind = 'object' AND object_id IS NOT NULL
  `.execute(db);

  await sql`CREATE INDEX idx_channels_creator ON channels (creator)`.execute(db);
  await sql`
    CREATE INDEX idx_channels_last_message_at
    ON channels (last_message_at_unix DESC NULLS LAST)
  `.execute(db);

  await sql`
    CREATE TABLE channel_members (
      channel_id       TEXT NOT NULL REFERENCES channels (channel_id) ON DELETE CASCADE,
      account          TEXT NOT NULL,
      role             TEXT NOT NULL DEFAULT 'member',
      joined_at_unix   BIGINT NOT NULL,
      PRIMARY KEY (channel_id, account)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_channel_members_account_joined
    ON channel_members (account, joined_at_unix DESC)
  `.execute(db);

  await sql`
    CREATE TABLE channel_aliases (
      alias            TEXT NOT NULL PRIMARY KEY,
      channel_id       TEXT NOT NULL REFERENCES channels (channel_id) ON DELETE CASCADE,
      registered_by    TEXT NOT NULL,
      created_at_unix  BIGINT NOT NULL,
      event_seq        BIGINT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_channel_aliases_channel_id ON channel_aliases (channel_id)
  `.execute(db);

  await sql`
    CREATE TABLE messages (
      message_id       TEXT NOT NULL PRIMARY KEY,
      channel_id       TEXT NOT NULL REFERENCES channels (channel_id) ON DELETE CASCADE,
      author           TEXT NOT NULL,
      body             TEXT,
      overflow_ref     TEXT,
      reply_to         TEXT,
      quote_json       JSONB,
      attachments      JSONB,
      mentions         TEXT[] NOT NULL DEFAULT '{}',
      created_at_unix  BIGINT NOT NULL,
      event_seq        BIGINT NOT NULL,
      transaction_id   TEXT NOT NULL,
      search_vector    TSVECTOR,
      CONSTRAINT chk_messages_body_or_overflow CHECK (
        body IS NOT NULL OR overflow_ref IS NOT NULL
      )
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_messages_channel_time
    ON messages (channel_id, created_at_unix DESC, event_seq DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_messages_author_time
    ON messages (author, created_at_unix DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_messages_mentions_gin
    ON messages USING GIN (mentions)
  `.execute(db);

  await sql`
    CREATE TABLE message_tombstones (
      message_id       TEXT NOT NULL PRIMARY KEY,
      channel_id       TEXT NOT NULL,
      deleted_by       TEXT NOT NULL,
      deleted_at_unix  BIGINT NOT NULL,
      event_seq        BIGINT NOT NULL,
      transaction_id   TEXT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_message_tombstones_channel
    ON message_tombstones (channel_id, deleted_at_unix DESC)
  `.execute(db);

  await sql`
    CREATE TABLE message_context_exclusions (
      message_id       TEXT NOT NULL PRIMARY KEY,
      excluded_by      TEXT NOT NULL,
      excluded_at_unix BIGINT NOT NULL,
      event_seq        BIGINT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_message_context_exclusions_by
    ON message_context_exclusions (excluded_by, excluded_at_unix DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_message_context_exclusions_by`.execute(db);
  await sql`DROP TABLE IF EXISTS message_context_exclusions`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_message_tombstones_channel`.execute(db);
  await sql`DROP TABLE IF EXISTS message_tombstones`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_messages_mentions_gin`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_messages_author_time`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_messages_channel_time`.execute(db);
  await sql`DROP TABLE IF EXISTS messages`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_channel_aliases_channel_id`.execute(db);
  await sql`DROP TABLE IF EXISTS channel_aliases`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_channel_members_account_joined`.execute(db);
  await sql`DROP TABLE IF EXISTS channel_members`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_channels_last_message_at`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_channels_creator`.execute(db);
  await sql`DROP INDEX IF EXISTS uq_channels_object_kind`.execute(db);
  await sql`DROP INDEX IF EXISTS uq_channels_direct_pair_hash`.execute(db);
  await sql`DROP TABLE IF EXISTS channels`.execute(db);
}
