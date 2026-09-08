import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import {
  SEARCH_BOOST_ACTIVE_STATUS,
  SEARCH_BOOST_DESCRIPTION,
  SEARCH_BOOST_INACTIVE_STATUS,
  SEARCH_BOOST_OVERVIEW_TYPE,
  SEARCH_BOOST_SKILL_TYPE,
  SEARCH_BOOST_SPEC_TYPE,
  SEARCH_BOOST_TITLE,
  SEARCH_WEIGHT_FTS,
  SEARCH_WEIGHT_TRGM,
} from '../constants/search-scoring';
import type { KnowledgeDatabase } from '../repository/types';
import { matchCuratedRoutes } from '../routing/curated-routes';
import { buildAutocompleteTsQuery } from './knowledge-query.builder';
import { typeBoost } from './search-type-boost';

export interface SearchKnowledgeInput {
  query: string;
  limit?: number;
  types?: string[];
  tags?: string[];
  scope?: string;
}

export interface SearchKnowledgeResult {
  file_path: string;
  title: string;
  description: string | null;
  heading: string | null;
  score: number;
  content: string;
  tags: string[];
  type: string;
}

export interface BuildContextInput {
  topic: string;
  maxChunks?: number;
  scope?: string;
}

export class KnowledgeSearchService {
  constructor(private readonly db: Kysely<KnowledgeDatabase>) {}

  async searchKnowledge(input: SearchKnowledgeInput): Promise<SearchKnowledgeResult[]> {
    const limit = input.limit ?? 10;
    const query = input.query.trim();
    if (!query) return [];

    const tsQueryStr = buildAutocompleteTsQuery(query);
    if (!tsQueryStr) return [];

    const tsQuery = sql`to_tsquery('english', ${tsQueryStr})`;

    const curated = matchCuratedRoutes(query, input.scope);
    const curatedResults =
      curated[0] && curated[0].confidence >= 0.4
        ? await this.getChunksForPaths(
            curated.slice(0, 2).map((c) => c.path),
            Math.min(2, limit),
          )
        : [];

    const ftsResults = await this.searchFts(input, tsQuery, query, limit);
    const mergedCurated = [...curatedResults];
    const seen = new Set(mergedCurated.map((r) => `${r.file_path}:${r.heading}`));
    for (const row of ftsResults) {
      const key = `${row.file_path}:${row.heading}`;
      if (!seen.has(key)) {
        mergedCurated.push(row);
        seen.add(key);
      }
    }
    if (mergedCurated.length >= limit) {
      return mergedCurated.slice(0, limit);
    }

    const existingPaths = new Set(mergedCurated.map((r) => r.file_path));
    const trgmResults = await this.searchTrigramFallback(
      input,
      query,
      limit - mergedCurated.length,
    );
    for (const row of trgmResults) {
      if (!existingPaths.has(row.file_path)) {
        mergedCurated.push(row);
      }
    }
    return mergedCurated.slice(0, limit);
  }

  private async searchFts(
    input: SearchKnowledgeInput,
    tsQuery: ReturnType<typeof sql>,
    query: string,
    limit: number,
  ): Promise<SearchKnowledgeResult[]> {
    const likePattern = `%${query}%`;
    let base = this.db
      .selectFrom('knowledge_chunks as c')
      .innerJoin('knowledge_files as f', 'f.id', 'c.file_id')
      .select([
        'f.path as file_path',
        'f.title',
        'f.description',
        'f.tags',
        'f.type',
        'f.status',
        'f.scope',
        'f.updated_at',
        'c.heading',
        'c.content',
        sql<number>`ts_rank_cd(c.search_vector, ${tsQuery}, 32)`.as('rank'),
        sql<number>`CASE WHEN f.title ILIKE ${likePattern} THEN ${sql.lit(SEARCH_BOOST_TITLE)} ELSE 0 END`.as(
          'title_boost',
        ),
        sql<number>`CASE WHEN f.description ILIKE ${likePattern} THEN ${sql.lit(SEARCH_BOOST_DESCRIPTION)} ELSE 0 END`.as(
          'description_boost',
        ),
        sql<number>`CASE WHEN f.type IN ('skill', 'playbook') THEN ${sql.lit(SEARCH_BOOST_SKILL_TYPE)} WHEN f.type IN ('spec', 'lesson', 'agents') THEN ${sql.lit(SEARCH_BOOST_SPEC_TYPE)} WHEN f.type = 'overview' THEN ${sql.lit(SEARCH_BOOST_OVERVIEW_TYPE)} ELSE 0 END`.as(
          'type_boost',
        ),
        sql<number>`CASE WHEN f.status = 'active' THEN ${sql.lit(SEARCH_BOOST_ACTIVE_STATUS)} ELSE ${sql.lit(SEARCH_BOOST_INACTIVE_STATUS)} END`.as(
          'status_boost',
        ),
        sql<number>`COALESCE(similarity(f.routing_text, ${query}), 0)`.as('trgm_sim'),
      ])
      .where(sql<boolean>`c.search_vector @@ ${tsQuery}`)
      .where('f.status', '=', 'active');

    if (input.types && input.types.length > 0) {
      base = base.where('f.type', 'in', input.types);
    }
    if (input.tags && input.tags.length > 0) {
      base = base.where(sql<boolean>`f.tags && ${input.tags}::text[]`);
    }
    if (input.scope) {
      base = base.where((eb) =>
        eb.or([
          eb('f.scope', '=', input.scope!),
          eb('f.path', 'like', `docs/apps/${input.scope}/%`),
        ]),
      );
    }

    const orderScore = sql`
      ${sql.lit(SEARCH_WEIGHT_FTS)} * ts_rank_cd(c.search_vector, ${tsQuery}, 32)
      + ${sql.lit(SEARCH_WEIGHT_TRGM)} * COALESCE(similarity(f.routing_text, ${query}), 0)
      + CASE WHEN f.title ILIKE ${likePattern} THEN ${sql.lit(SEARCH_BOOST_TITLE)} ELSE 0 END
      + CASE WHEN f.description ILIKE ${likePattern} THEN ${sql.lit(SEARCH_BOOST_DESCRIPTION)} ELSE 0 END
      + CASE WHEN f.type IN ('skill', 'playbook') THEN ${sql.lit(SEARCH_BOOST_SKILL_TYPE)} WHEN f.type IN ('spec', 'lesson', 'agents') THEN ${sql.lit(SEARCH_BOOST_SPEC_TYPE)} WHEN f.type = 'overview' THEN ${sql.lit(SEARCH_BOOST_OVERVIEW_TYPE)} ELSE 0 END
      + CASE WHEN f.status = 'active' THEN ${sql.lit(SEARCH_BOOST_ACTIVE_STATUS)} ELSE ${sql.lit(SEARCH_BOOST_INACTIVE_STATUS)} END
    `;

    const rows = await base.orderBy(orderScore, 'desc').limit(limit).execute();

    return rows.map((r) => this.mapRow(r));
  }

  private async searchTrigramFallback(
    input: SearchKnowledgeInput,
    query: string,
    limit: number,
  ): Promise<SearchKnowledgeResult[]> {
    if (limit <= 0) return [];

    let filesQ = this.db
      .selectFrom('knowledge_files as f')
      .select([
        'f.path as file_path',
        'f.title',
        'f.description',
        'f.tags',
        'f.type',
        sql<number>`similarity(f.routing_text, ${query})`.as('sim'),
      ])
      .where('f.status', '=', 'active')
      .where(sql<boolean>`f.routing_text IS NOT NULL`)
      .where(sql<boolean>`f.routing_text % ${query}`);

    if (input.types && input.types.length > 0) {
      filesQ = filesQ.where('f.type', 'in', input.types);
    }
    if (input.tags && input.tags.length > 0) {
      filesQ = filesQ.where(sql<boolean>`f.tags && ${input.tags}::text[]`);
    }
    if (input.scope) {
      filesQ = filesQ.where((eb) =>
        eb.or([
          eb('f.scope', '=', input.scope!),
          eb('f.path', 'like', `docs/apps/${input.scope}/%`),
        ]),
      );
    }

    const files = await filesQ.orderBy(sql`similarity(f.routing_text, ${query})`, 'desc').limit(limit).execute();

    const results: SearchKnowledgeResult[] = [];
    for (const file of files) {
      const chunk = await this.db
        .selectFrom('knowledge_chunks as c')
        .innerJoin('knowledge_files as f', 'f.id', 'c.file_id')
        .select(['c.heading', 'c.content'])
        .where('f.path', '=', file.file_path)
        .orderBy('c.chunk_index', 'asc')
        .limit(1)
        .executeTakeFirst();

      if (!chunk) continue;

      results.push({
        file_path: file.file_path,
        title: file.title,
        description: file.description,
        heading: chunk.heading,
        score: Number(file.sim) * SEARCH_WEIGHT_TRGM + typeBoost(file.type),
        content: chunk.content,
        tags: file.tags,
        type: file.type,
      });
    }

    return results;
  }

  private mapRow(r: {
    file_path: string;
    title: string;
    description: string | null;
    heading: string | null;
    content: string;
    tags: string[];
    type: string;
    rank: number;
    title_boost: number;
    description_boost: number;
    type_boost: number;
    status_boost: number;
    trgm_sim: number;
  }): SearchKnowledgeResult {
    return {
      file_path: r.file_path,
      title: r.title,
      description: r.description,
      heading: r.heading,
      score:
        Number(r.rank) * SEARCH_WEIGHT_FTS +
        Number(r.trgm_sim) * SEARCH_WEIGHT_TRGM +
        Number(r.title_boost) +
        Number(r.description_boost) +
        Number(r.type_boost) +
        Number(r.status_boost),
      content: r.content,
      tags: r.tags,
      type: r.type,
    };
  }

  async getChunksForPaths(paths: string[], maxChunks: number): Promise<SearchKnowledgeResult[]> {
    if (paths.length === 0 || maxChunks <= 0) return [];

    const picked: SearchKnowledgeResult[] = [];
    const perFile = Math.max(1, Math.ceil(maxChunks / paths.length));

    for (const filePath of paths) {
      const rows = await this.db
        .selectFrom('knowledge_chunks as c')
        .innerJoin('knowledge_files as f', 'f.id', 'c.file_id')
        .select([
          'f.path as file_path',
          'f.title',
          'f.description',
          'f.tags',
          'f.type',
          'c.heading',
          'c.content',
          'c.chunk_index',
        ])
        .where('f.path', '=', filePath)
        .where('f.status', '=', 'active')
        .orderBy('c.chunk_index', 'asc')
        .limit(perFile)
        .execute();

      for (const r of rows) {
        picked.push({
          file_path: r.file_path,
          title: r.title,
          description: r.description,
          heading: r.heading,
          score: 1 - r.chunk_index * 0.01,
          content: r.content,
          tags: r.tags,
          type: r.type,
        });
        if (picked.length >= maxChunks) {
          return picked;
        }
      }
    }

    return picked;
  }

  async buildContext(input: BuildContextInput): Promise<SearchKnowledgeResult[]> {
    return this.buildContextFromSearch(input);
  }

  async buildContextFromSearch(input: BuildContextInput): Promise<SearchKnowledgeResult[]> {
    const maxChunks = input.maxChunks ?? 8;
    const results = await this.searchKnowledge({
      query: input.topic,
      limit: maxChunks * 3,
      scope: input.scope,
    });

    const byFile = new Map<string, number>();
    const picked: SearchKnowledgeResult[] = [];

    for (const row of results) {
      const count = byFile.get(row.file_path) ?? 0;
      if (count >= 2) continue;
      byFile.set(row.file_path, count + 1);
      picked.push(row);
      if (picked.length >= maxChunks) break;
    }

    if (input.scope && picked.length < maxChunks) {
      const agents = await this.searchKnowledge({
        query: `AGENTS ${input.scope}`,
        limit: 2,
        types: ['agents'],
        scope: input.scope,
      });
      for (const a of agents) {
        if (!picked.some((p) => p.file_path === a.file_path && p.heading === a.heading)) {
          picked.unshift(a);
        }
      }
    }

    return picked.slice(0, maxChunks);
  }
}
