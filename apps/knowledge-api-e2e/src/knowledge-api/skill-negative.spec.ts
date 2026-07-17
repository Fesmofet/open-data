import { mcpCallTool } from '../support/mcp-client';
import { PATHS, type SearchKnowledgeResponse } from '../support/knowledge-fixtures';

describe('POST /knowledge/mcp — negative search', () => {
  it('does not surface hive signup skill for unrelated solana query', async () => {
    const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
      'search_knowledge',
      { query: 'create solana wallet with phantom', limit: 10 },
    );
    expect(isError).toBe(false);

    const topPaths = data.results.slice(0, 3).map((r) => r.file_path);
    expect(topPaths).not.toContain(PATHS.hiveSignup);
  });

  it('does not surface OBL skills for unrelated solana query', async () => {
    const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
      'search_knowledge',
      { query: 'create solana wallet with phantom', limit: 10 },
    );
    expect(isError).toBe(false);

    const topPaths = data.results.slice(0, 3).map((r) => r.file_path);
    expect(topPaths).not.toContain(PATHS.oblOffersContracts);
    expect(topPaths).not.toContain(PATHS.oblLedger);
    expect(topPaths).not.toContain(PATHS.oblDisputes);
  });
});
