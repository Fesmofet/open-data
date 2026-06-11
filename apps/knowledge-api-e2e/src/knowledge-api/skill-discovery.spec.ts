import { mcpCallTool } from '../support/mcp-client';
import {
  AGENT_WORKSPACE_QUERIES,
  APP_SPEC_DISCOVERY_QUERIES,
  assertSearchFindsSkill,
  assertTopResultIs,
  assertTopResultIsNot,
  HIVE_BROADCAST_DISCOVERY_QUERIES,
  HIVE_DISCOVERY_QUERIES,
  LOCAL_DEV_QUERIES,
  PATHS,
  ROUTING_DISCOVERY_QUERIES,
  type SearchKnowledgeResponse,
} from '../support/knowledge-fixtures';

describe('POST /knowledge/mcp — skill discovery', () => {
  describe('hive account signup', () => {
    it.each(HIVE_DISCOVERY_QUERIES)(
      'finds $expectedPath for "$query"',
      async ({ query, expectedPath }) => {
        const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
          'search_knowledge',
          { query, limit: 10 },
        );
        expect(isError).toBe(false);
        assertSearchFindsSkill(data.results, expectedPath);
      },
    );
  });

  describe('knowledge api routing', () => {
    it.each(ROUTING_DISCOVERY_QUERIES)(
      'finds $expectedPath for "$query"',
      async ({ query, expectedPath }) => {
        const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
          'search_knowledge',
          { query, limit: 10 },
        );
        expect(isError).toBe(false);
        assertSearchFindsSkill(data.results, expectedPath);
      },
    );
  });

  describe('app spec discovery', () => {
    it.each(APP_SPEC_DISCOVERY_QUERIES)(
      'finds $expectedPath for "$query" with scope $scope',
      async ({ query, expectedPath, scope }) => {
        const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
          'search_knowledge',
          { query, limit: 10, scope },
        );
        expect(isError).toBe(false);
        assertSearchFindsSkill(data.results, expectedPath);
      },
    );
  });

  describe('hive blockchain broadcast', () => {
    it.each(HIVE_BROADCAST_DISCOVERY_QUERIES)(
      'finds $expectedPath for "$query"',
      async ({ query, expectedPath }) => {
        const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
          'search_knowledge',
          { query, limit: 10 },
        );
        expect(isError).toBe(false);
        assertSearchFindsSkill(data.results, expectedPath);
      },
    );

    it('prefers signup over broadcast for "create hive account"', async () => {
      const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
        'search_knowledge',
        { query: 'create hive account', limit: 10 },
      );
      expect(isError).toBe(false);
      assertSearchFindsSkill(data.results, PATHS.hiveSignup);
      assertTopResultIsNot(data.results, PATHS.hiveBroadcast);
    });
  });

  describe('agent workspace (sidecar agent / clone)', () => {
    it.each(AGENT_WORKSPACE_QUERIES)(
      'finds $expectedPath for "$query"',
      async ({ query, expectedPath }) => {
        const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
          'search_knowledge',
          { query, limit: 10 },
        );
        expect(isError).toBe(false);
        assertSearchFindsSkill(data.results, expectedPath);
      },
    );

    it('prefers local dev over agent workspace for "how to run the project locally"', async () => {
      const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
        'search_knowledge',
        { query: 'how to run the project locally', limit: 10 },
      );
      expect(isError).toBe(false);
      assertSearchFindsSkill(data.results, PATHS.localDev);
      assertTopResultIsNot(data.results, PATHS.agentWorkspace);
    });
  });

  describe('local dev environment (docker / migrate / serve)', () => {
    it.each(LOCAL_DEV_QUERIES)(
      'finds $expectedPath for "$query"',
      async ({ query, expectedPath }) => {
        const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
          'search_knowledge',
          { query, limit: 10 },
        );
        expect(isError).toBe(false);
        assertSearchFindsSkill(data.results, expectedPath);
      },
    );

    it('ranks agent workspace first for "clone repository for sidecar agent"', async () => {
      const { data, isError } = await mcpCallTool<SearchKnowledgeResponse>(
        'search_knowledge',
        { query: 'clone repository for sidecar agent', limit: 10 },
      );
      expect(isError).toBe(false);
      assertTopResultIs(data.results, PATHS.agentWorkspace);
    });
  });
});
