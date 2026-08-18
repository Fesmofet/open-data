type JsonRpcRequest = {
  id?: unknown;
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
};

const TRUNCATE = 120;

function truncate(value: string, max = TRUNCATE): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

function stringifyArg(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return JSON.stringify(truncate(value));
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const inner = value.slice(0, 5).map((v) => stringifyArg(v)).join(', ');
    return value.length > 5 ? `[${inner}, …+${value.length - 5}]` : `[${inner}]`;
  }
  return truncate(JSON.stringify(value));
}

/** One-line summary of tool arguments for debug logs (no secrets expected in MCP tools). */
export function summarizeToolArguments(
  toolName: string,
  args: Record<string, unknown> | undefined,
): string {
  if (!args || Object.keys(args).length === 0) {
    return '';
  }

  const preferredKeys: Record<string, readonly string[]> = {
    search_knowledge: ['query', 'limit', 'scope', 'types', 'tags'],
    get_file: ['path'],
    get_context: ['topic', 'max_chunks', 'scope'],
    list_files: ['type', 'scope', 'status', 'tags'],
    reindex: ['path'],
    get_object_type: ['object_type'],
    get_object_create_playbook: ['object_type'],
    get_update_schema: ['update_type'],
  };

  const keys = preferredKeys[toolName] ?? Object.keys(args).sort();
  const parts: string[] = [];

  for (const key of keys) {
    if (!(key in args)) continue;
    parts.push(`${key}=${stringifyArg(args[key])}`);
  }

  return parts.join(' ');
}

export function summarizeMcpRequest(body: unknown): string {
  if (Array.isArray(body)) {
    return body.map((item) => summarizeMcpRequest(item)).join(' | ');
  }
  if (!body || typeof body !== 'object') {
    return 'invalid-jsonrpc';
  }

  const req = body as JsonRpcRequest;
  const method = req.method ?? 'unknown';

  if (method === 'tools/call' && req.params?.name) {
    const argsSummary = summarizeToolArguments(req.params.name, req.params.arguments);
    return argsSummary
      ? `tools/call ${req.params.name} ${argsSummary}`
      : `tools/call ${req.params.name}`;
  }

  if (method === 'tools/list') {
    return 'tools/list';
  }

  if (req.params && Object.keys(req.params).length > 0) {
    return `${method} ${truncate(JSON.stringify(req.params))}`;
  }

  return method;
}

export function extractRpcId(body: unknown): string {
  if (Array.isArray(body)) {
    const ids = body
      .map((item) => (item && typeof item === 'object' ? (item as JsonRpcRequest).id : undefined))
      .filter((id) => id !== undefined);
    return ids.length > 0 ? ids.map(String).join(',') : '-';
  }
  if (body && typeof body === 'object' && 'id' in body) {
    const id = (body as JsonRpcRequest).id;
    return id === undefined ? '-' : String(id);
  }
  return '-';
}
