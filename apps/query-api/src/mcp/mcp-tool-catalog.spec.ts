import {
  QUERY_MCP_TOOL_CATALOG,
  REGISTERED_MCP_TOOL_NAMES,
  catalogDescription,
} from './mcp-tool-catalog';

describe('QUERY_MCP_TOOL_CATALOG', () => {
  it('has unique tool names', () => {
    const names = QUERY_MCP_TOOL_CATALOG.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('includes HTTP parity tools added in hardening', () => {
    expect(REGISTERED_MCP_TOOL_NAMES).toContain('get_post_discussion');
    expect(REGISTERED_MCP_TOOL_NAMES).toHaveLength(QUERY_MCP_TOOL_CATALOG.length);
  });

  it('catalogDescription returns description for every entry', () => {
    for (const entry of QUERY_MCP_TOOL_CATALOG) {
      expect(catalogDescription(entry.name)).toBe(entry.description);
      expect(entry.description.length).toBeGreaterThan(20);
    }
  });
});
