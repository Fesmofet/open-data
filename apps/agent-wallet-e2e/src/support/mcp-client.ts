export interface McpRpcResponse {
  jsonrpc: string;
  id?: unknown;
  result?: {
    protocolVersion?: string;
    capabilities?: { tools?: Record<string, unknown> };
    serverInfo?: { name?: string; version?: string };
    tools?: { name: string; description?: string }[];
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
  const host = process.env.HOST ?? '127.0.0.1';
  const port = process.env.PORT ?? '7500';
  return `http://${host}:${port}`;
}

function bearerToken(): string {
  const token = process.env.AGENT_WALLET_BEARER_TOKEN;
  if (!token) {
    throw new Error('AGENT_WALLET_BEARER_TOKEN is not set');
  }
  return token;
}

export async function mcpRequest(
  method: string,
  params: Record<string, unknown> = {},
  id: string | number = 1,
): Promise<McpRpcResponse> {
  const res = await fetch(`${baseUrl()}/agent-wallet/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      authorization: `Bearer ${bearerToken()}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }),
  });

  return {
    status: res.status,
    ...(await res.json()),
  } as McpRpcResponse & { status: number };
}

export async function mcpInitialize(): Promise<McpRpcResponse['result']> {
  const rpc = await mcpRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'agent-wallet-e2e', version: '1.0.0' },
  });
  expect((rpc as { status?: number }).status).toBe(200);
  expect(rpc.error).toBeUndefined();
  return rpc.result;
}

export async function mcpListTools(): Promise<string[]> {
  const rpc = await mcpRequest('tools/list', {});
  expect((rpc as { status?: number }).status).toBe(200);
  expect(rpc.error).toBeUndefined();
  return (rpc.result?.tools ?? []).map((t) => t.name);
}

export async function mcpCallTool<T = unknown>(
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolCallResult<T>> {
  const rpc = await mcpRequest('tools/call', { name, arguments: args }, `${name}-${Date.now()}`);
  expect((rpc as { status?: number }).status).toBe(200);
  expect(rpc.error).toBeUndefined();

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

export async function mcpUnauthorized(): Promise<number> {
  const res = await fetch(`${baseUrl()}/agent-wallet/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'unauth',
      method: 'initialize',
      params: {},
    }),
  });
  return res.status;
}

export async function mcpCorsProbe(): Promise<Headers> {
  const res = await fetch(`${baseUrl()}/agent-wallet/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      origin: 'https://evil.example',
      authorization: `Bearer ${bearerToken()}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'cors',
      method: 'initialize',
      params: {},
    }),
  });
  return res.headers;
}
