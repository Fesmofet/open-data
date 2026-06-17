import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Virtual Related album: one row per post image linked to an object via post_objects.
 * @see docs/spec/data-model/post-object-related-images.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE post_object_related_images (
      object_id   TEXT NOT NULL REFERENCES objects_core(object_id) ON DELETE CASCADE,
      author      TEXT NOT NULL,
      permlink    TEXT NOT NULL,
      image_url   TEXT NOT NULL,
      sort_ord    SMALLINT NOT NULL DEFAULT 0,
      PRIMARY KEY (object_id, author, permlink, image_url),
      FOREIGN KEY (author, permlink) REFERENCES posts(author, permlink) ON DELETE CASCADE
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_post_object_related_images_object_id
      ON post_object_related_images (object_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_post_object_related_images_object_id`.execute(
    db,
  );
  await sql`DROP TABLE IF EXISTS post_object_related_images`.execute(db);
}
