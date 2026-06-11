import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import {
  ROUTE_CONFIDENCE_THRESHOLD,
  ROUTE_MIN_SIMILARITY,
} from '../constants/search-scoring';
import type { KnowledgeDatabase } from '../repository/types';
import type { KnowledgeSearchService, SearchKnowledgeResult } from '../search/knowledge-search.service';
import { matchCuratedRoutes } from './curated-routes';

export interface ResolveDocInput {
  topic: string;
  scope?: string;
  maxRoutes?: number;
}

export interface ResolvedRoute {
  path: string;
  title: string;
  description: string | null;
  confidence: number;
  reason: string;
}

export interface ResolveDocResult {
  routes: ResolvedRoute[];
  topConfidence: number;
}

export class KnowledgeRouteResolver {
  constructor(
    private readonly db: Kysely<KnowledgeDatabase>,
    private readonly search: KnowledgeSearchService,
  ) {}

  async resolveDoc(input: ResolveDocInput): Promise<ResolveDocResult> {
    const maxRoutes = input.maxRoutes ?? 5;
    const topic = input.topic.trim();
    if (!topic) {
      return { routes: [], topConfidence: 0 };
    }

    const curated = matchCuratedRoutes(topic, input.scope);
    const curatedRoutes: ResolvedRoute[] = [];

    for (const hit of curated.slice(0, maxRoutes)) {
      const file = await this.db
        .selectFrom('knowledge_files')
        .select(['path', 'title', 'description'])
        .where('path', '=', hit.path)
        .where('status', '=', 'active')
        .executeTakeFirst();
      if (file) {
        curatedRoutes.push({
          path: file.path,
          title: file.title,
          description: file.description,
          confidence: hit.confidence,
          reason: hit.reason,
        });
      }
    }

    const trigramRoutes = await this.resolveByTrigram(topic, input.scope, maxRoutes);

    const merged = new Map<string, ResolvedRoute>();
    for (const route of [...curatedRoutes, ...trigramRoutes]) {
      const existing = merged.get(route.path);
      if (!existing || route.confidence > existing.confidence) {
        merged.set(route.path, route);
      }
    }

    let routes = [...merged.values()].sort((a, b) => b.confidence - a.confidence).slice(0, maxRoutes);

    if (routes.length === 0 || routes[0]!.confidence < ROUTE_CONFIDENCE_THRESHOLD) {
      const searchHits = await this.search.searchKnowledge({
        query: topic,
        limit: maxRoutes,
        scope: input.scope,
      });
      for (const hit of searchHits) {
        if (merged.has(hit.file_path)) continue;
        routes.push({
          path: hit.file_path,
          title: hit.title,
          description: hit.description,
          confidence: Math.min(1, hit.score / 2),
          reason: 'hybrid-search',
        });
      }
      routes = routes.sort((a, b) => b.confidence - a.confidence).slice(0, maxRoutes);
    }

    return {
      routes,
      topConfidence: routes[0]?.confidence ?? 0,
    };
  }

  private async resolveByTrigram(
    topic: string,
    scope: string | undefined,
    limit: number,
  ): Promise<ResolvedRoute[]> {
    let q = this.db
      .selectFrom('knowledge_files')
      .select([
        'path',
        'title',
        'description',
        sql<number>`similarity(routing_text, ${topic})`.as('sim'),
      ])
      .where('status', '=', 'active')
      .where(sql<boolean>`routing_text IS NOT NULL`)
      .where(sql<boolean>`similarity(routing_text, ${topic}) >= ${ROUTE_MIN_SIMILARITY}`);

    if (scope) {
      q = q.where((eb) =>
        eb.or([eb('scope', '=', scope), eb('path', 'like', `docs/apps/${scope}/%`)]),
      );
    }

    const rows = await q.orderBy(sql`similarity(routing_text, ${topic})`, 'desc').limit(limit).execute();

    return rows.map((r) => ({
      path: r.path,
      title: r.title,
      description: r.description,
      confidence: Number(r.sim),
      reason: 'trigram:routing_text',
    }));
  }

  async buildContextRoutes(input: {
    topic: string;
    scope?: string;
    maxChunks: number;
  }): Promise<{ routes: ResolvedRoute[]; chunks: SearchKnowledgeResult[] }> {
    const resolved = await this.resolveDoc({
      topic: input.topic,
      scope: input.scope,
      maxRoutes: input.maxChunks,
    });

    if (resolved.topConfidence >= ROUTE_CONFIDENCE_THRESHOLD && resolved.routes.length > 0) {
      const paths = resolved.routes.map((r) => r.path);
      const chunks = await this.search.getChunksForPaths(paths, input.maxChunks);
      return { routes: resolved.routes, chunks };
    }

    const chunks = await this.search.buildContextFromSearch({
      topic: input.topic,
      maxChunks: input.maxChunks,
      scope: input.scope,
    });
    return { routes: resolved.routes, chunks };
  }
}
