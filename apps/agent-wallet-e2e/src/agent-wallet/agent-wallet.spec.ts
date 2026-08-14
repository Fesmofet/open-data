import {
  mcpCallTool,
  mcpCorsProbe,
  mcpInitialize,
  mcpListTools,
  mcpUnauthorized,
} from '../support/mcp-client';
import {
  FakeHasServer,
  parseHasDeepLink,
} from '../support/fake-has-server';

const REQUIRED_TOOLS = [
  'wallet_status',
  'waivio_auth_start',
  'waivio_auth_status',
  'waivio_auth_logout',
  'ipfs_upload_image',
  'wallet_broadcast',
  'wallet_broadcast_status',
  'has_login_start',
  'has_login_status',
  'has_login_qr',
  'has_session',
  'has_logout',
  'odl_build_object_create',
  'odl_build_update_create',
  'odl_build_gallery_item',
  'has_broadcast',
  'has_broadcast_status',
];

function fakeHas(): FakeHasServer {
  const server = globalThis.__FAKE_HAS__;
  if (!server) {
    throw new Error('Fake HAS server is not running');
  }
  return server;
}

async function waitFor<T>(
  fn: () => T | Promise<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 5_000,
): Promise<T> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await fn();
    if (predicate(value)) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for condition');
}

async function readPendingDeepLink(requestId: string): Promise<string> {
  const artifacts = await mcpCallTool<{ deepLink: string }>('has_login_qr', {
    requestId,
  });
  expect(artifacts.isError).toBe(false);
  return artifacts.data.deepLink;
}

async function ensureLoggedIn(account: string): Promise<void> {
  const session = await mcpCallTool<{ active: boolean; session?: { account: string } }>(
    'has_session',
    {},
  );
  if (
    session.data.active &&
    session.data.session?.account === account
  ) {
    return;
  }

  const login = await mcpCallTool<{
    requestId: string;
    alreadyActive?: boolean;
  }>('has_login_start', { account });

  expect(login.isError).toBe(false);
  if (login.data.alreadyActive) {
    return;
  }

  const link = parseHasDeepLink(await readPendingDeepLink(login.data.requestId));
  await fakeHas().approveAuth({
    uuid: link.uuid,
    authKey: link.key,
    account: link.account,
  });

  await waitFor(
    () =>
      mcpCallTool<{ status: string }>('has_login_status', {
        requestId: login.data.requestId,
      }),
    (result) => result.data.status === 'active',
  );
}

describe('agent-wallet MCP (e2e)', () => {
  it('rejects MCP without bearer token', async () => {
    expect(await mcpUnauthorized()).toBe(401);
  });

  it('initializes MCP with required tools and no CORS headers', async () => {
    const result = await mcpInitialize();
    expect(result?.serverInfo?.name).toBe('agent-wallet');

    const tools = await mcpListTools();
    for (const tool of REQUIRED_TOOLS) {
      expect(tools).toContain(tool);
    }

    const headers = await mcpCorsProbe();
    expect(headers.get('access-control-allow-origin')).toBeNull();
  });

  it('runs login → object_create → broadcast happy path', async () => {
    const login = await mcpCallTool<{
      requestId: string;
      webLink: string;
    }>('has_login_start', { account: 'alice' });

    expect(login.isError).toBe(false);
    expect(login.rawText).not.toContain('eyJ');
    expect(login.rawText).not.toContain('qrAscii');

    const qr = await mcpCallTool<{ deepLink: string; qrAscii: string }>(
      'has_login_qr',
      { requestId: login.data.requestId },
    );
    expect(qr.data.deepLink.startsWith('has://auth_req/')).toBe(true);
    expect(qr.data.qrAscii.length).toBeGreaterThan(0);

    const link = parseHasDeepLink(qr.data.deepLink);
    await fakeHas().approveAuth({
      uuid: link.uuid,
      authKey: link.key,
      account: link.account,
    });

    const loginStatus = await waitFor(
      () =>
        mcpCallTool<{ status: string }>('has_login_status', {
          requestId: login.data.requestId,
        }),
      (result) => result.data.status === 'active',
    );
    expect(loginStatus.data.status).toBe('active');

    const session = await mcpCallTool<{ active: boolean; session: { account: string } }>(
      'has_session',
      {},
    );
    expect(session.data.active).toBe(true);
    expect(session.data.session.account).toBe('alice');
    expect(session.rawText).not.toContain(link.key);

    const built = await mcpCallTool<{
      ops: unknown[];
      opsCount: number;
      bytes: number;
    }>('odl_build_object_create', {
      objectType: 'recipe',
      objectId: 'recipe-e2e-1',
      creator: 'alice',
      fields: [{ updateType: 'name', value: 'Borscht' }],
    });
    expect(built.data.opsCount).toBeGreaterThan(0);

    const broadcast = await mcpCallTool<{ requestId: string }>('has_broadcast', {
      ops: built.data.ops,
      keyType: 'posting',
    });
    expect(broadcast.isError).toBe(false);

    const broadcastStatus = await waitFor(
      () =>
        mcpCallTool<{ status: string; transactionId?: string }>(
          'has_broadcast_status',
          { requestId: broadcast.data.requestId },
        ),
      (result) => result.data.status === 'signed',
    );
    expect(broadcastStatus.data.transactionId).toBe('trx-fake-1');
  });

  it('builds update_create without object_create for existing objects', async () => {
    const built = await mcpCallTool<{
      ops: Array<{ json?: string }>;
      opsCount: number;
    }>('odl_build_update_create', {
      objectId: 'recipe-e2e-existing',
      creator: 'alice',
      updateType: 'image',
      value: { cid: 'QmE2eTestCid' },
    });

    expect(built.isError).toBe(false);
    expect(built.data.opsCount).toBe(1);
    const envelope = JSON.parse(built.data.ops[0]?.json ?? '{}') as {
      events: Array<{ action: string }>;
    };
    expect(envelope.events).toHaveLength(1);
    expect(envelope.events[0]?.action).toBe('update_create');
  });

  it('returns rejected broadcast status when user rejects', async () => {
    await ensureLoggedIn('alice');

    const built = await mcpCallTool<{ ops: unknown[] }>('odl_build_object_create', {
      objectType: 'recipe',
      objectId: 'recipe-e2e-reject',
      creator: 'alice',
      fields: [{ updateType: 'name', value: 'Reject me' }],
    });

    fakeHas().setNextSignBehavior('reject');

    const broadcast = await mcpCallTool<{ requestId: string }>('has_broadcast', {
      ops: built.data.ops,
      keyType: 'posting',
    });

    const status = await waitFor(
      () =>
        mcpCallTool<{ status: string; transactionId?: string }>(
          'has_broadcast_status',
          { requestId: broadcast.data.requestId },
        ),
      (result) => result.data.status === 'rejected',
    );

    expect(status.data.transactionId).toBeUndefined();
  });

  it('rejects broadcast without active session after logout', async () => {
    await mcpCallTool('has_logout', {});

    const result = await mcpCallTool('has_broadcast', {
      ops: [
        {
          type: 'custom_json',
          json: '{"events":[]}',
          required_auths: [],
          required_posting_auths: ['alice'],
          id: 'odl-testnet',
        },
      ],
      keyType: 'posting',
    });

    expect(result.isError).toBe(true);
    expect(result.rawText).toContain('No active HAS session');
  });

  it('reuses a live pending login on repeated has_login_start', async () => {
    const first = await mcpCallTool<{ requestId: string; webLink: string }>(
      'has_login_start',
      { account: 'alice' },
    );
    const second = await mcpCallTool<{ requestId: string; webLink: string }>(
      'has_login_start',
      { account: 'alice' },
    );

    expect(second.data.requestId).toBe(first.data.requestId);
    expect(second.data.webLink).toBe(first.data.webLink);
    expect(first.data.webLink).toContain('/has#1');
  });
});
