import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';
import { buildAutocompleteTsQuery } from './search-fts.utils';
import { prefixUpperBound, shouldSearchObjectIdSubstring } from './search-prefix.utils';

export interface SearchObjectCandidateRow {
  object_id: string;
  object_type: string;
  meta_group_id: string | null;
  weight: number | null;
}

export interface SearchUserRow {
  name: string;
  posting_json_metadata: string | null;
  json_metadata: string | null;
  profile_image: string | null;
  object_reputation: number;
  wobjects_weight: number;
  followers_count: number;
  is_following: boolean;
}

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Text update kinds indexed for FTS (`search_vector`); see `object_updates` trigger in schema. */
const FTS_TEXT_UPDATE_TYPES = [
  UPDATE_TYPES.NAME,
  UPDATE_TYPES.TITLE,
  UPDATE_TYPES.DESCRIPTION,
] as const;

/** Sort tier: FTS hit (default). */
const SEARCH_TIER_FTS = 0;
/** Sort tier: exact `value_text_normalized` match (multi-word queries only). */
const SEARCH_TIER_EXACT_TEXT = 1;
/** Sort tier: `object_id` substring (id-shaped queries). */
const SEARCH_TIER_ID_SUBSTRING = 2;
/** Sort tier: exact `objects_core.object_id` (draft / linked-object hydration). */
const SEARCH_TIER_EXACT_OBJECT_ID = 3;

/** Min query length for the trigram-backed name/title prefix boost (shorter degrades to seq scan). */
const NAME_PREFIX_MIN_LENGTH = 3;

@Injectable()
export class SearchRepository {
  private readonly logger = new Logger(SearchRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  /**
   * Object hits: FTS on `name` / `title` / `description`, optional id substring and
   * exact name boost (multi-word only). No `ts_rank` over the full hit set — keeps GIN path fast.
   * Ranking priority: name/title starts-with the full query (trigram index, includes stopwords the
   * `english` FTS strips) > sort tier > `objects_core.weight` (earned payouts).
   */
  async searchObjects(
    queryText: string,
    limit: number,
  ): Promise<SearchObjectCandidateRow[]> {
    const trimmed = queryText.trim();
    if (!trimmed) {
      return [];
    }

    const tsQuery = buildAutocompleteTsQuery(trimmed);
    if (tsQuery === null) {
      return [];
    }

    const normalized = trimmed.toLowerCase();
    const isMultiWord = /\s/.test(trimmed);
    const includeIdSubstring = shouldSearchObjectIdSubstring(trimmed);
    const idSubstringPattern = `%${escapeIlikePattern(trimmed)}%`;
    const useFastFtsPath = !isMultiWord && !includeIdSubstring;
    // Name/title starts-with boost (trigram index). Needs >= 3 chars so pg_trgm avoids a seq scan.
    const includeNamePrefix = normalized.length >= NAME_PREFIX_MIN_LENGTH;
    const namePrefixPattern = `${escapeIlikePattern(normalized)}%`;

    try {
      const result = useFastFtsPath
        ? await sql<SearchObjectCandidateRow>`
            WITH exact_object_id AS (
              SELECT object_id
              FROM objects_core
              WHERE status = 'active' AND object_id = ${trimmed}
            ),
            fts_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]}, ${FTS_TEXT_UPDATE_TYPES[2]})
                AND ou.search_vector @@ to_tsquery('english', ${tsQuery})
            ),
            name_prefix_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ${includeNamePrefix}
                AND ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]})
                AND ou.value_text_normalized LIKE ${namePrefixPattern} ESCAPE '\\'
            ),
            candidate_ids AS (
              SELECT object_id FROM exact_object_id
              UNION
              SELECT object_id FROM fts_ids
              UNION
              SELECT object_id FROM name_prefix_ids
            ),
            collapsed AS (
              SELECT DISTINCT ON (COALESCE(oc.meta_group_id, oc.object_id))
                oc.object_id AS object_id,
                oc.object_type AS object_type,
                oc.meta_group_id AS meta_group_id,
                oc.weight AS weight,
                (np.object_id IS NOT NULL) AS is_name_prefix
              FROM objects_core oc
              INNER JOIN candidate_ids c ON c.object_id = oc.object_id
              LEFT JOIN name_prefix_ids np ON np.object_id = oc.object_id
              WHERE oc.status = 'active'
              ORDER BY COALESCE(oc.meta_group_id, oc.object_id), oc.weight DESC NULLS LAST
            )
            SELECT object_id, object_type, meta_group_id, weight
            FROM collapsed
            ORDER BY is_name_prefix DESC, weight DESC NULLS LAST, object_id
            LIMIT ${limit}
          `.execute(this.db)
        : await sql<SearchObjectCandidateRow>`
            WITH exact_object_id AS (
              SELECT object_id
              FROM objects_core
              WHERE status = 'active' AND object_id = ${trimmed}
            ),
            fts_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]}, ${FTS_TEXT_UPDATE_TYPES[2]})
                AND ou.search_vector @@ to_tsquery('english', ${tsQuery})
            ),
            exact_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ${isMultiWord}
                AND ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]}, ${FTS_TEXT_UPDATE_TYPES[2]})
                AND ou.value_text_normalized = ${normalized}
            ),
            name_prefix_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ${includeNamePrefix}
                AND ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]})
                AND ou.value_text_normalized LIKE ${namePrefixPattern} ESCAPE '\\'
            ),
            id_hits AS (
              SELECT object_id
              FROM objects_core
              WHERE status = 'active'
                AND ${includeIdSubstring}
                AND object_id ILIKE ${idSubstringPattern} ESCAPE '\\'
            ),
            candidates AS (
              SELECT object_id, ${SEARCH_TIER_EXACT_OBJECT_ID}::int AS sort_tier FROM exact_object_id
              UNION ALL
              SELECT object_id, ${SEARCH_TIER_ID_SUBSTRING}::int AS sort_tier FROM id_hits
              UNION ALL
              SELECT object_id, ${SEARCH_TIER_EXACT_TEXT}::int FROM exact_ids
              UNION ALL
              SELECT object_id, ${SEARCH_TIER_FTS}::int FROM fts_ids
              UNION ALL
              SELECT object_id, ${SEARCH_TIER_FTS}::int FROM name_prefix_ids
            ),
            best AS (
              SELECT object_id, MAX(sort_tier) AS sort_tier
              FROM candidates
              GROUP BY object_id
            ),
            collapsed AS (
              SELECT DISTINCT ON (COALESCE(oc.meta_group_id, oc.object_id))
                oc.object_id AS object_id,
                oc.object_type AS object_type,
                oc.meta_group_id AS meta_group_id,
                oc.weight AS weight,
                b.sort_tier AS sort_tier,
                (np.object_id IS NOT NULL) AS is_name_prefix
              FROM objects_core oc
              INNER JOIN best b ON b.object_id = oc.object_id
              LEFT JOIN name_prefix_ids np ON np.object_id = oc.object_id
              WHERE oc.status = 'active'
              ORDER BY COALESCE(oc.meta_group_id, oc.object_id), b.sort_tier DESC, oc.weight DESC NULLS LAST
            )
            SELECT object_id, object_type, meta_group_id, weight
            FROM collapsed
            ORDER BY is_name_prefix DESC, sort_tier DESC, weight DESC NULLS LAST, object_id
            LIMIT ${limit}
          `.execute(this.db);

      return (result.rows as SearchObjectCandidateRow[]) ?? [];
    } catch (error) {
      this.logger.error(
        `searchObjects failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Prefix match on `accounts_current.name` (btree range on PK), ordered by exact name match,
   * then Waiv object weight then followers.
   */
  async searchUsers(queryText: string, limit: number, viewer?: string | null): Promise<SearchUserRow[]> {
    const trimmed = queryText.trim();
    if (!trimmed) {
      return [];
    }

    const prefix = escapeIlikePattern(trimmed).toLowerCase();
    const upper = prefixUpperBound(prefix);
    const viewerTrimmed = viewer?.trim() || '';

    try {
      const rows = await this.db
        .selectFrom('accounts_current')
        .select([
          'name',
          'posting_json_metadata',
          'json_metadata',
          'profile_image',
          'object_reputation',
          'wobjects_weight',
          'followers_count',
          viewerTrimmed.length === 0
            ? sql<boolean>`false`.as('is_following')
            : sql<boolean>`EXISTS (
              SELECT 1 FROM user_subscriptions us
              WHERE us.follower = ${viewerTrimmed}
                AND us.following = accounts_current.name
            )`.as('is_following'),
        ])
        .where('name', '>=', prefix)
        .where('name', '<', upper)
        .orderBy(sql`CASE WHEN name = ${prefix} THEN 0 ELSE 1 END`)
        .orderBy(sql`wobjects_weight desc nulls last`)
        .orderBy('followers_count', 'desc')
        .limit(limit)
        .execute();

      return rows.map((r) => ({
        name: r.name,
        posting_json_metadata: r.posting_json_metadata,
        json_metadata: r.json_metadata,
        profile_image: r.profile_image,
        object_reputation: r.object_reputation,
        wobjects_weight: r.wobjects_weight ?? 0,
        followers_count: r.followers_count,
        is_following: Boolean(r.is_following),
      }));
    } catch (error) {
      this.logger.error(
        `searchUsers failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Global object counts per `object_type` for query `q` (deduped by `meta_group_id`, active only).
   */
  async countObjectsByType(queryText: string): Promise<Record<string, number>> {
    const trimmed = queryText.trim();
    if (!trimmed) {
      return {};
    }

    const tsQuery = buildAutocompleteTsQuery(trimmed);
    if (tsQuery === null) {
      return {};
    }

    const includeIdSubstring = shouldSearchObjectIdSubstring(trimmed);
    const idSubstringPattern = `%${escapeIlikePattern(trimmed)}%`;

    try {
      const result = includeIdSubstring
        ? await sql<{ object_type: string; cnt: number | string }>`
            WITH fts_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]}, ${FTS_TEXT_UPDATE_TYPES[2]})
                AND ou.search_vector @@ to_tsquery('english', ${tsQuery})
            ),
            id_hits AS (
              SELECT object_id
              FROM objects_core
              WHERE status = 'active'
                AND object_id ILIKE ${idSubstringPattern} ESCAPE '\\'
            ),
            candidate_ids AS (
              SELECT object_id FROM fts_ids
              UNION
              SELECT object_id FROM id_hits
            )
            SELECT oc.object_type AS object_type,
              COUNT(DISTINCT COALESCE(oc.meta_group_id, oc.object_id))::int AS cnt
            FROM objects_core oc
            INNER JOIN candidate_ids c ON c.object_id = oc.object_id
            WHERE oc.status = 'active'
            GROUP BY oc.object_type
          `.execute(this.db)
        : await sql<{ object_type: string; cnt: number | string }>`
            WITH fts_ids AS (
              SELECT DISTINCT ou.object_id
              FROM object_updates ou
              WHERE ou.update_type IN (${FTS_TEXT_UPDATE_TYPES[0]}, ${FTS_TEXT_UPDATE_TYPES[1]}, ${FTS_TEXT_UPDATE_TYPES[2]})
                AND ou.search_vector @@ to_tsquery('english', ${tsQuery})
            )
            SELECT oc.object_type AS object_type,
              COUNT(DISTINCT COALESCE(oc.meta_group_id, oc.object_id))::int AS cnt
            FROM objects_core oc
            INNER JOIN fts_ids c ON c.object_id = oc.object_id
            WHERE oc.status = 'active'
            GROUP BY oc.object_type
          `.execute(this.db);

      const out: Record<string, number> = {};
      for (const row of result.rows) {
        const raw = row.cnt;
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isFinite(n)) {
          out[row.object_type] = Math.trunc(n);
        }
      }
      return out;
    } catch (error) {
      this.logger.error(
        `countObjectsByType failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {};
    }
  }

  /** Total users matching the name prefix for `q` (no row cap). */
  async countUsers(queryText: string): Promise<number> {
    const trimmed = queryText.trim();
    if (!trimmed) {
      return 0;
    }

    const prefix = escapeIlikePattern(trimmed).toLowerCase();
    const upper = prefixUpperBound(prefix);

    try {
      const row = await this.db
        .selectFrom('accounts_current')
        .select((eb) => eb.fn.countAll<number>().as('n'))
        .where('name', '>=', prefix)
        .where('name', '<', upper)
        .executeTakeFirst();

      const raw = row?.n;
      const n = typeof raw === 'number' ? raw : Number(raw ?? 0);
      return Number.isFinite(n) ? Math.trunc(n) : 0;
    } catch (error) {
      this.logger.error(
        `countUsers failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
