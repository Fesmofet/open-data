import {
  assertToolExists,
  mcpInitialize,
  mcpListResources,
  mcpListTools,
  mcpReadResource,
  mcpRequest,
} from '../support/mcp-client';
import { CORE_MCP_TOOLS } from '../support/knowledge-fixtures';

describe('POST /knowledge/mcp — session', () => {
  it('should initialize MCP and advertise knowledge-api server', async () => {
    const result = await mcpInitialize();
    expect(result?.instructions).toContain('knowledge-api-routing');
    expect(result?.instructions).toContain('resolve_doc');
    expect(result?.instructions).toContain('list_files');
  });

  it('should list and read routing MCP resource', async () => {
    const uris = await mcpListResources();
    expect(uris).toContain('odl-knowledge://routing');

    const body = await mcpReadResource('odl-knowledge://routing');
    expect(body).toContain('Decision table');
  });

  it('should list core MCP tools with enriched descriptions', async () => {
    const names = await mcpListTools();
    for (const tool of CORE_MCP_TOOLS) {
      assertToolExists(names, tool);
    }

    const rpc = await mcpRequest('tools/list', {});
    const searchTool = rpc.result?.tools?.find((t) => t.name === 'search_knowledge');
    expect(searchTool?.description?.length ?? 0).toBeGreaterThan(40);
  });
});
