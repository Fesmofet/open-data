import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { KnowledgeDatabase } from '../repository/types';

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

    const tsQuery = sql`plainto_tsquery('english', ${query})`;

    let base = this.db
      .selectFrom('knowledge_chunks as c')
      .innerJoin('knowledge_files as f', 'f.id', 'c.file_id')
      .select([
        'f.path as file_path',
        'f.title',
        'f.tags',
        'f.type',
        'f.status',
        'f.scope',
        'f.updated_at',
        'c.heading',
        'c.content',
        sql<number>`ts_rank(c.search_vector, ${tsQuery})`.as('rank'),
        sql<number>`CASE WHEN f.title ILIKE ${'%' + query + '%'} THEN 0.5 ELSE 0 END`.as(
          'title_boost',
        ),
        sql<number>`CASE WHEN f.type = 'skill' THEN 0.25 WHEN f.type IN ('spec', 'lesson', 'agents') THEN 0.2 WHEN f.type = 'overview' THEN -0.1 ELSE 0 END`.as(
          'type_boost',
        ),
        sql<number>`CASE WHEN f.status = 'active' THEN 0.1 ELSE -0.5 END`.as('status_boost'),
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

    const rows = await base
      .orderBy(
        sql`ts_rank(c.search_vector, ${tsQuery}) + CASE WHEN f.title ILIKE ${'%' + query + '%'} THEN 0.5 ELSE 0 END + CASE WHEN f.type = 'skill' THEN 0.25 WHEN f.type IN ('spec', 'lesson', 'agents') THEN 0.2 WHEN f.type = 'overview' THEN -0.1 ELSE 0 END + CASE WHEN f.status = 'active' THEN 0.1 ELSE -0.5 END`,
        'desc',
      )
      .limit(limit)
      .execute();

    return rows.map((r) => ({
      file_path: r.file_path,
      title: r.title,
      heading: r.heading,
      score:
        Number(r.rank) +
        Number(r.title_boost) +
        Number(r.type_boost) +
        Number(r.status_boost),
      content: r.content,
      tags: r.tags,
      type: r.type,
    }));
  }

  async buildContext(input: BuildContextInput): Promise<SearchKnowledgeResult[]> {
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
