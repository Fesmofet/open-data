import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

import { GetUserEngineWalletHistoryEndpoint } from './get-user-engine-wallet-history.endpoint';

describe('GetUserEngineWalletHistoryEndpoint', () => {
  const accounts = { findByName: jest.fn() };
  const pager = { collectPage: jest.fn() };

  let endpoint: GetUserEngineWalletHistoryEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    endpoint = new GetUserEngineWalletHistoryEndpoint(
      accounts as never,
      pager as never,
    );
    accounts.findByName.mockResolvedValue({ name: 'alice' });
  });

  it('returns null when account missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    const result = await endpoint.execute('missing', {});
    expect(result).toBeNull();
  });

  it('throws on invalid cursor', async () => {
    await expect(
      endpoint.execute('alice', { cursor: 'not-valid' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws 503 when RPC unavailable and page empty', async () => {
    pager.collectPage.mockResolvedValue({
      items: [],
      cursor: null,
      hasMore: false,
      rpcUnavailable: true,
    });
    await expect(endpoint.execute('alice', {})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns pager result including deposit instruction rows', async () => {
    pager.collectPage.mockResolvedValue({
      items: [
        {
          id: 'rpc:1',
          operation: 'tokens_transfer',
          source: 'rpc',
          timestamp: '2020-01-01T00:00:00.000Z',
          kind: 'transfer',
          payload: { symbol: 'DEC' },
        },
        {
          id: 'deposit:7',
          operation: 'hive_engine_deposit',
          source: 'deposit',
          timestamp: '2020-01-02T00:00:00.000Z',
          kind: 'deposit_instruction',
          payload: { symbolIn: 'HIVE', symbolOut: 'SWAP.HIVE' },
        },
        {
          id: 'swap:1',
          operation: 'marketpools_swapTokens',
          source: 'swap',
          timestamp: '2020-01-01T00:00:00.000Z',
          kind: 'swap',
          payload: { symbolIn: 'WAIV', symbolOut: 'SWAP.HIVE' },
        },
      ],
      cursor: 'abc',
      hasMore: true,
      rpcUnavailable: false,
    });
    const result = await endpoint.execute('alice', { limit: 10 });
    expect(result?.items).toHaveLength(3);
    expect(result?.items.some((i) => i.source === 'deposit')).toBe(true);
    expect(result?.hasMore).toBe(true);
    expect(pager.collectPage).toHaveBeenCalledWith(
      expect.objectContaining({ account: 'alice', limit: 10 }),
    );
  });
});
