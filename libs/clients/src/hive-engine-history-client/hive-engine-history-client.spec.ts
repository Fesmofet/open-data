import { HiveEngineHistoryClient } from './hive-engine-history-client';
import type { UrlRotationService } from '../redis-client';

describe('HiveEngineHistoryClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds accountHistory GET URL with query params', async () => {
    let capturedUrl = '';
    global.fetch = jest.fn(async (url: string | URL) => {
      capturedUrl = String(url);
      return {
        ok: true,
        json: async () => [
          {
            account: 'alice',
            authorperm: '@alice/post-1',
            quantity: '1.5',
            symbol: 'WAIV',
            operation: 'comments_authorReward',
            timestamp: 1_700_000_000,
          },
        ],
      } as unknown as Response;
    });

    const urlRotationService = {
      getManager: () => ({
        getBestUrl: async () => 'https://accounts.hive-engine.com',
        recordRequest: async () => undefined,
      }),
    } as unknown as UrlRotationService;

    const client = new HiveEngineHistoryClient(
      {
        nodes: ['https://accounts.hive-engine.com'],
        maxResponseTimeMs: 5000,
      },
      urlRotationService,
    );

    const rows = await client.accountHistory({
      account: 'alice',
      symbol: 'WAIV',
      ops: 'comments_authorReward,comments_beneficiaryReward',
      timestampStart: 100,
      timestampEnd: 200,
      limit: 10,
    });

    expect(capturedUrl).toContain('accountHistory');
    expect(capturedUrl).toContain('account=alice');
    expect(capturedUrl).toContain('symbol=WAIV');
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe('1.5');
  });

  it('returns empty array on HTTP error', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const urlRotationService = {
      getManager: () => ({
        getBestUrl: async () => 'https://history.hive-engine.com',
        recordRequest: async () => undefined,
      }),
    } as unknown as UrlRotationService;

    const client = new HiveEngineHistoryClient(
      { nodes: ['https://history.hive-engine.com'] },
      urlRotationService,
    );

    const rows = await client.accountHistory({ account: 'bob' });
    expect(rows).toEqual([]);
  });
});
