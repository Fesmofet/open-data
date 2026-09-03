import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Object ids mentioned in object-channel message bodies (index-time extract).
 * @see docs/spec/data-model/messages.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE messages
      ADD COLUMN linked_object_ids TEXT[] NOT NULL DEFAULT '{}'
  `.execute(db);

  await sql`
    CREATE INDEX idx_messages_linked_object_ids
      ON messages USING GIN (linked_object_ids)
  `.execute(db);

  await sql`
    WITH extracted AS (
      SELECT
        m.message_id,
        COALESCE(
          (
            SELECT ARRAY(
              SELECT DISTINCT (match)[1]
              FROM regexp_matches(m.body, '/object/([a-z0-9._-]+)', 'gi') AS match
              INNER JOIN objects_core oc ON oc.object_id = (match)[1]
              WHERE (match)[1] <> c.object_id
              LIMIT 20
            )
          ),
          '{}'::text[]
        ) AS linked_ids
      FROM messages m
      INNER JOIN channels c ON c.channel_id = m.channel_id
      WHERE c.kind = 'object'
        AND m.body IS NOT NULL
        AND m.body ~ '/object/'
    )
    UPDATE messages m
    SET linked_object_ids = e.linked_ids
    FROM extracted e
    WHERE m.message_id = e.message_id
      AND cardinality(e.linked_ids) > 0
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_messages_linked_object_ids`.execute(db);
  await sql`
    ALTER TABLE messages
      DROP COLUMN IF EXISTS linked_object_ids
  `.execute(db);
}
