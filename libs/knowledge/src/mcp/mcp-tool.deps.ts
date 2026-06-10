import type { Kysely } from 'kysely';
import type { KnowledgeDatabase } from '../repository/types';
import type { KnowledgeRepository } from '../repository/knowledge.repository';
import type { KnowledgeSearchService } from '../search/knowledge-search.service';

export interface KnowledgeMcpDeps {
  db: Kysely<KnowledgeDatabase>;
  repo: KnowledgeRepository;
  search: KnowledgeSearchService;
  workspaceRoot: string;
  allowReindex: boolean;
}
