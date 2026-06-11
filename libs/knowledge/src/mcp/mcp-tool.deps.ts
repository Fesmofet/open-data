import type { Kysely } from 'kysely';
import type { KnowledgeDatabase } from '../repository/types';
import type { KnowledgeRepository } from '../repository/knowledge.repository';
import type { KnowledgeRouteResolver } from '../routing/knowledge-route.resolver';
import type { KnowledgeSearchService } from '../search/knowledge-search.service';

export interface KnowledgeMcpDeps {
  db: Kysely<KnowledgeDatabase>;
  repo: KnowledgeRepository;
  search: KnowledgeSearchService;
  router: KnowledgeRouteResolver;
  workspaceRoot: string;
  allowReindex: boolean;
}
