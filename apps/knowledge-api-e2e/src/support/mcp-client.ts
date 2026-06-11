export interface McpRpcResponse {
  jsonrpc: string;
  id?: unknown;
  result?: {
    protocolVersion?: string;
    capabilities?: { tools?: Record<string, unknown> };
    serverInfo?: { name?: string; version?: string };
    instructions?: string;
    tools?: { name: string; description?: string }[];
    resources?: { uri: string; name?: string }[];
    contents?: { uri: string; mimeType?: string; text?: string }[];
    content?: { type: string; text?: string }[];
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

export interface McpToolCallResult<T = unknown> {
  data: T;
  isError: boolean;
  rawText: string;
}

function baseUrl(): string {
  const url = process.env.E2E_BASE_URL;
  if (!url) {
    throw new Error('E2E_BASE_URL is not set (check test-setup.ts)');
  }
  return url;
}

export async function mcpRequest(
  method: string,
  params: Record<string, unknown> = {},
  id: string | number = 1,
): Promise<McpRpcResponse> {
  const res = await fetch(`${baseUrl()}/knowledge/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }),
  });

  expect(res.status).toBe(200);
  const data = (await res.json()) as McpRpcResponse;
  expect(data.error).toBeUndefined();
  return data;
}

export async function mcpInitialize(): Promise<McpRpcResponse['result']> {
  const rpc = await mcpRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'knowledge-api-e2e', version: '1.0.0' },
  });
  const result = rpc.result;
  expect(result?.protocolVersion).toBeTruthy();
  expect(result?.serverInfo?.name).toBe('knowledge-api');
  expect(result?.capabilities?.tools).toBeDefined();
  return result;
}

export async function mcpListTools(): Promise<string[]> {
  const rpc = await mcpRequest('tools/list', {});
  return (rpc.result?.tools ?? []).map((t) => t.name);
}

export async function mcpListResources(): Promise<string[]> {
  const rpc = await mcpRequest('resources/list', {});
  return (rpc.result?.resources ?? []).map((r) => r.uri);
}

export async function mcpReadResource(uri: string): Promise<string> {
  const rpc = await mcpRequest('resources/read', { uri });
  return rpc.result?.contents?.[0]?.text ?? '';
}

export function assertToolExists(names: string[], tool: string): void {
  expect(names).toContain(tool);
}

export async function mcpCallTool<T = unknown>(
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolCallResult<T>> {
  const rpc = await mcpRequest('tools/call', { name, arguments: args }, `${name}-${Date.now()}`);
  const result = rpc.result;
  const rawText = result?.content?.[0]?.text ?? '';
  const isError = result?.isError === true;

  if (isError || !rawText) {
    return { data: rawText as T, isError: true, rawText };
  }

  return {
    data: JSON.parse(rawText) as T,
    isError: false,
    rawText,
  };
}
