import { QUERY_API_MCP_INSTRUCTIONS } from './mcp-instructions';

describe('QUERY_API_MCP_INSTRUCTIONS', () => {
  it('distinguishes live data from knowledge-api', () => {
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('**not** knowledge-api');
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('search_knowledge');
  });

  it('includes decision table tools', () => {
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('resolve_object');
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('discover_objects');
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('get_post_discussion');
  });

  it('documents context params', () => {
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('governance_object_id');
    expect(QUERY_API_MCP_INSTRUCTIONS).toContain('odl-query://routing');
  });
});
