import { waitForPortOpen } from '@nx/node/utils';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

async function assertKnowledgeIndexPopulated(baseUrl: string): Promise<void> {
  const res = await fetch(`${baseUrl}/knowledge/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'global-setup',
      method: 'tools/call',
      params: {
        name: 'search_knowledge',
        arguments: { query: 'hive account', limit: 1 },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Knowledge MCP sanity check failed (HTTP ${res.status}). Run: pnpm migrate && pnpm knowledge:reindex`,
    );
  }

  const rpc = (await res.json()) as {
    error?: { message?: string };
    result?: { content?: { text?: string }[]; isError?: boolean };
  };

  if (rpc.error) {
    throw new Error(
      `Knowledge MCP sanity check RPC error: ${rpc.error.message ?? 'unknown'}. Run: pnpm migrate && pnpm knowledge:reindex`,
    );
  }

  if (rpc.result?.isError) {
    throw new Error(
      `Knowledge MCP sanity check tool error. Run: pnpm migrate && pnpm knowledge:reindex`,
    );
  }

  const text = rpc.result?.content?.[0]?.text;
  if (!text) {
    throw new Error(
      'Knowledge MCP sanity check returned empty content. Run: pnpm migrate && pnpm knowledge:reindex',
    );
  }

  const data = JSON.parse(text) as { results?: unknown[] };
  if (!data.results?.length) {
    throw new Error(
      'Knowledge index appears empty (search_knowledge returned 0 hits). Run: pnpm migrate && pnpm knowledge:reindex',
    );
  }
}

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 7400;
  await waitForPortOpen(port, { host });

  const baseUrl = `http://${host}:${port}`;
  await assertKnowledgeIndexPopulated(baseUrl);

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
