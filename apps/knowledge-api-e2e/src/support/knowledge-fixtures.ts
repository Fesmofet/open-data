export const PATHS = {
  knowledgeRouting: 'docs/skills/knowledge-api-routing.md',
  hiveSignup: 'docs/skills/hive-account-signup.md',
  hiveBroadcast: 'docs/skills/hive-blockchain-broadcast.md',
  agentWorkspace: 'docs/skills/setup-workspace.md',
  localDev: 'docs/getting-started.md',
} as const;

export const ALL_SKILL_PATHS = [
  PATHS.knowledgeRouting,
  PATHS.hiveSignup,
  PATHS.hiveBroadcast,
  PATHS.agentWorkspace,
] as const;

export interface SearchResult {
  file_path: string;
  title: string;
  description: string | null;
  heading: string | null;
  score: number;
  content: string;
  tags: string[];
  type: string;
}

export interface SearchKnowledgeResponse {
  results: SearchResult[];
}

export interface GetFileResponse {
  path: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  tags: string[];
  body: string;
}

export interface ListFilesResponse {
  files: {
    path: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
    scope: string;
    tags: string[];
  }[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetContextResponse {
  routes: { path: string; confidence: number; reason: string }[];
  results: SearchResult[];
}

export interface ResolveDocResponse {
  routes: {
    path: string;
    title: string;
    description: string | null;
    confidence: number;
    reason: string;
  }[];
  topConfidence: number;
}

export const CORE_MCP_TOOLS = [
  'search_knowledge',
  'resolve_doc',
  'get_file',
  'get_context',
  'list_files',
  'list_tags',
] as const;

export const APP_SPEC_DISCOVERY_QUERIES = [
  {
    query: 'chain indexer vote ingestion',
    expectedPath: 'docs/apps/chain-indexer/spec/vote-ingestion.md',
    scope: 'chain-indexer',
  },
] as const;

export const HIVE_DISCOVERY_QUERIES = [
  { query: 'create hive account', expectedPath: PATHS.hiveSignup },
  { query: 'hive account signup', expectedPath: PATHS.hiveSignup },
  { query: 'how to create hive account', expectedPath: PATHS.hiveSignup },
  { query: 'register new hive user', expectedPath: PATHS.hiveSignup },
] as const;

export const HIVE_BROADCAST_DISCOVERY_QUERIES = [
  { query: 'hive blockchain broadcast', expectedPath: PATHS.hiveBroadcast },
  { query: 'broadcast custom_json odl', expectedPath: PATHS.hiveBroadcast },
  { query: 'object create broadcast hive', expectedPath: PATHS.hiveBroadcast },
  { query: 'sign hive transaction dhive', expectedPath: PATHS.hiveBroadcast },
] as const;

export const AGENT_WORKSPACE_QUERIES = [
  { query: 'setup agent workspace', expectedPath: PATHS.agentWorkspace },
  { query: 'clone repo for sidecar agent', expectedPath: PATHS.agentWorkspace },
  { query: 'agent workspace without checkout', expectedPath: PATHS.agentWorkspace },
] as const;

export const ROUTING_DISCOVERY_QUERIES = [
  { query: 'knowledge api routing', expectedPath: PATHS.knowledgeRouting },
  { query: 'how to use knowledge mcp', expectedPath: PATHS.knowledgeRouting },
  { query: 'agent first visit documentation', expectedPath: PATHS.knowledgeRouting },
] as const;

export const LOCAL_DEV_QUERIES = [
  { query: 'local development environment', expectedPath: PATHS.localDev },
  { query: 'prepare local development environment', expectedPath: PATHS.localDev },
  { query: 'how to run the project locally', expectedPath: PATHS.localDev },
] as const;

export function assertSearchFindsSkill(
  results: SearchResult[],
  expectedPath: string,
  topN = 3,
): void {
  const topPaths = results.slice(0, topN).map((r) => r.file_path);
  expect(topPaths).toContain(expectedPath);
}

export function assertTopResultIs(results: SearchResult[], expectedPath: string): void {
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].file_path).toBe(expectedPath);
}

export function assertTopResultIsNot(results: SearchResult[], excludedPath: string): void {
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].file_path).not.toBe(excludedPath);
}
