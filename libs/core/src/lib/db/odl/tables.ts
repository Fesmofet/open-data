/**
 * Table row types for the PostgreSQL concept schema.
 * @see spec/postgres-concept/schema.sql
 * @see spec/postgres-concept/flow.md
 */

/** objects_core: slim identity and metadata per object. */
export interface ObjectsCoreRow {
  object_id: string;
  object_type: string;
  creator: string;
  weight: number | null;
  meta_group_id: string | null;
  seq: number;
}

/** object_updates: one row per active update. value_geo (PostGIS) and search_vector (tsvector) are driver-specific on read. */
export interface ObjectUpdatesRow {
  update_id: string;
  object_id: string;
  update_type: string;
  creator: string;
  cardinality: 'single' | 'multi';
  created_at_unix: number;
  block_num: number;
  trx_index: number;
  op_index: number;
  transaction_id: string;
  value_kind: 'text' | 'geo' | 'json';
  value_text: string | null;
  value_geo: unknown;
  value_json: unknown;
  value_text_normalized: string | null;
  search_vector: unknown;
}

/** validity_votes: one row per validity vote. FK to object_updates ON DELETE CASCADE. */
export interface ValidityVotesRow {
  update_id: string;
  object_id: string;
  voter: string;
  vote: 'for' | 'against';
  block_num: number;
  trx_index: number;
  op_index: number;
  transaction_id: string;
}

/** rank_votes: one row per rank vote. rank 1..10000. FK to object_updates ON DELETE CASCADE. */
export interface RankVotesRow {
  update_id: string;
  object_id: string;
  voter: string;
  rank: number;
  rank_context: string;
  block_num: number;
  trx_index: number;
  op_index: number;
  transaction_id: string;
}

/** accounts_current: Hive account state + ODL object_reputation. */
export interface AccountsCurrentRow {
  name: string;
  hive_id: number | null;
  json_metadata: string | null;
  posting_json_metadata: string | null;
  created: string | null;
  comment_count: number;
  lifetime_vote_count: number;
  post_count: number;
  last_post: string | null;
  last_root_post: string | null;
  object_reputation: number;
  updated_at_unix: number | null;
}
