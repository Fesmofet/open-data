import type { ColumnType, Generated } from 'kysely';

export interface KnowledgeFilesTable {
  id: Generated<string>;
  path: string;
  title: string;
  body: string;
  type: string;
  status: string;
  scope: string | null;
  owner: string | null;
  tags: string[];
  source_root: string;
  content_hash: string;
  updated_at: ColumnType<Date, Date | string, Date | string>;
  indexed_at: ColumnType<Date, Date | string, Date | string>;
}

export interface KnowledgeChunksTable {
  id: Generated<string>;
  file_id: string;
  heading: string | null;
  heading_path: string[];
  chunk_index: number;
  content: string;
  token_count: number | null;
  section_type: string | null;
  metadata: ColumnType<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
  search_vector: ColumnType<unknown, unknown, unknown>;
  created_at: ColumnType<Date, Date | string, Date | string>;
}

export interface KnowledgeDatabase {
  knowledge_files: KnowledgeFilesTable;
  knowledge_chunks: KnowledgeChunksTable;
}

export interface KnowledgeFileRow {
  id: string;
  path: string;
  title: string;
  body: string;
  type: string;
  status: string;
  scope: string | null;
  owner: string | null;
  tags: string[];
  source_root: string;
  content_hash: string;
  updated_at: Date;
  indexed_at: Date;
}

export interface KnowledgeChunkInsert {
  heading: string | null;
  heading_path: string[];
  chunk_index: number;
  content: string;
  token_count: number;
  section_type: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeFileUpsert {
  path: string;
  title: string;
  body: string;
  type: string;
  status: string;
  scope: string | null;
  owner: string | null;
  tags: string[];
  source_root: string;
  content_hash: string;
  updated_at: Date | null;
  chunks: KnowledgeChunkInsert[];
}

export interface ListFilesFilters {
  type?: string;
  status?: string;
  scope?: string;
  tags?: string[];
}
