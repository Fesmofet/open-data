import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { REGISTERED_MCP_TOOL_NAMES } from './mcp-tool-catalog';
import type { McpToolDeps } from './mcp-tool.deps';
import { registerAllMcpTools } from './register-all-tools';

describe('registerAllMcpTools', () => {
  it('registers every catalog tool', () => {
    const registered: string[] = [];
    const server = {
      registerTool: (name: string) => {
        registered.push(name);
      },
    } as unknown as McpServer;

    registerAllMcpTools(server, {} as McpToolDeps);

    expect(registered.sort()).toEqual([...REGISTERED_MCP_TOOL_NAMES].sort());
  });
});
