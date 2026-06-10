import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Agent knowledge base: indexed markdown docs and FTS chunks. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE knowledge_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      path TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      scope TEXT,
      owner TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      source_root TEXT NOT NULL DEFAULT 'docs',
      content_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX knowledge_files_tags_idx ON knowledge_files USING GIN (tags)
  `.execute(db);

  await sql`
    CREATE INDEX knowledge_files_type_status_idx ON knowledge_files (type, status)
  `.execute(db);

  await sql`
    CREATE TABLE knowledge_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES knowledge_files(id) ON DELETE CASCADE,
      heading TEXT,
      heading_path TEXT[] NOT NULL DEFAULT '{}',
      chunk_index INT NOT NULL,
      content TEXT NOT NULL,
      token_count INT,
      section_type TEXT,
      metadata JSONB NOT NULL DEFAULT '{}',
      search_vector TSVECTOR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX knowledge_chunks_file_id_idx ON knowledge_chunks (file_id)
  `.execute(db);

  await sql`
    CREATE INDEX knowledge_chunks_search_idx ON knowledge_chunks USING GIN (search_vector)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS knowledge_chunks`.execute(db);
  await sql`DROP TABLE IF EXISTS knowledge_files`.execute(db);
}
