import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpToolDeps } from './mcp-tool.deps';
import { registerCategoryTools } from './tools/categories.tools';
import { registerCurrencyTools } from './tools/currency.tools';
import { registerDiscoverTools } from './tools/discover.tools';
import { registerObjectTools } from './tools/objects.tools';
import { registerPostTools } from './tools/posts.tools';
import { registerSearchTools } from './tools/search.tools';
import { registerUserTools } from './tools/users.tools';
import { registerOblTools } from './tools/obl.tools';

export function registerAllMcpTools(server: McpServer, deps: McpToolDeps): void {
  registerSearchTools(server, deps);
  registerDiscoverTools(server, deps);
  registerObjectTools(server, deps);
  registerUserTools(server, deps);
  registerCategoryTools(server, deps);
  registerPostTools(server, deps);
  registerCurrencyTools(server, deps);
  registerOblTools(server, deps);
}
