import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { McpToolDeps } from '../mcp-tool.deps';
import { registerChannelTools } from './channels.tools';

type RegisteredTool = {
  name: string;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

function registerWithCapture(deps: McpToolDeps): RegisteredTool[] {
  const tools: RegisteredTool[] = [];
  registerChannelTools(
    {
      registerTool: (
        name: string,
        _meta: unknown,
        handler: (args: Record<string, unknown>) => Promise<unknown>,
      ) => {
        tools.push({ name, handler });
      },
    } as unknown as McpServer,
    deps,
  );
  return tools;
}

describe('registerChannelTools', () => {
  it('get_channels delegates to GetChannelsEndpoint with viewer', async () => {
    const execute = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
    const tools = registerWithCapture({
      getChannels: { execute },
    } as unknown as McpToolDeps);

    const getChannels = tools.find((tool) => tool.name === 'get_channels');
    expect(getChannels).toBeDefined();

    const result = await getChannels!.handler({
      viewer: 'alice',
      kind: 'group',
      limit: 10,
    });

    expect(execute).toHaveBeenCalledWith('alice', {
      kind: 'group',
      limit: 10,
      cursor: undefined,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ items: [], nextCursor: null }, null, 2),
        },
      ],
    });
  });

  it('get_channel_by_id returns tool error when channel is missing', async () => {
    const tools = registerWithCapture({
      getChannelById: {
        execute: jest.fn().mockResolvedValue(null),
      },
    } as unknown as McpToolDeps);

    const getById = tools.find((tool) => tool.name === 'get_channel_by_id');
    const result = await getById!.handler({
      channel_id: 'missing',
      viewer: 'alice',
    });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Channel not found: missing' }],
    });
  });
});
