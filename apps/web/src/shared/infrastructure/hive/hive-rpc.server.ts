import 'server-only';

import { safeFetch } from '@/shared/infrastructure/http/safe-fetch.server';

const DEFAULT_HIVE_RPC_NODES = [
  'https://api.deathwing.me',
  'https://api.hive.blog',
  'https://api.openhive.network',
] as const;

const HIVE_RPC_TIMEOUT_MS = 8000;

function resolveHiveRpcNodes(): readonly string[] {
  const raw = process.env['HIVE_RPC_URL']?.trim();
  if (!raw) {
    return DEFAULT_HIVE_RPC_NODES;
  }
  const nodes = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return nodes.length > 0 ? nodes : DEFAULT_HIVE_RPC_NODES;
}

type HiveJsonRpcResponse<T> = {
  result?: T;
  error?: { message?: string };
};

export async function hiveRpcRequest<T>(
  method: string,
  params: unknown,
): Promise<T | null> {
  const nodes = resolveHiveRpcNodes();
  const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });

  for (const node of nodes) {
    const fetched = await safeFetch(node, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(HIVE_RPC_TIMEOUT_MS),
    });

    if (!fetched.ok) {
      continue;
    }

    try {
      const bodyText = await fetched.response.text();
      const data = JSON.parse(bodyText) as HiveJsonRpcResponse<T>;
      if (data.error) {
        continue;
      }
      if (data.result !== undefined) {
        return data.result;
      }
    } catch {
      continue;
    }
  }

  return null;
}
