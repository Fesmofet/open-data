import type { Kysely } from 'kysely';
import type { KnowledgeDatabase } from '../repository/types';
import { runKnowledgeReindex } from './knowledge-indexer';
import { writeAgentRoutesFile } from '../routing/write-agent-routes';

jest.mock('../routing/write-agent-routes', () => ({
  writeAgentRoutesFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../config/scan-sources', () => ({
  scanKnowledgeSourcePaths: jest.fn().mockResolvedValue([]),
  readSourceFile: jest.fn(),
}));

jest.mock('../registry/build-registry-documents', () => ({
  buildRegistryDocuments: jest.fn().mockReturnValue([]),
}));

jest.mock('../repository/knowledge.repository', () => ({
  KnowledgeRepository: jest.fn().mockImplementation(() => ({
    findFileByPath: jest.fn().mockResolvedValue(null),
    upsertFile: jest.fn().mockResolvedValue(undefined),
    listPaths: jest.fn().mockResolvedValue([]),
    listRouteCatalog: jest.fn().mockResolvedValue([]),
  })),
}));

const writeAgentRoutesFileMock = writeAgentRoutesFile as jest.MockedFunction<
  typeof writeAgentRoutesFile
>;

describe('runKnowledgeReindex', () => {
  const db = {} as Kysely<KnowledgeDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips agent-routes file when writeAgentRoutes is false', async () => {
    await runKnowledgeReindex(db, {
      workspaceRoot: '/tmp/workspace',
      writeAgentRoutes: false,
    });

    expect(writeAgentRoutesFileMock).not.toHaveBeenCalled();
  });

  it('writes agent-routes file by default', async () => {
    await runKnowledgeReindex(db, {
      workspaceRoot: '/tmp/workspace',
    });

    expect(writeAgentRoutesFileMock).toHaveBeenCalled();
  });
});
