jest.mock('server-only', () => ({}));

import { getEngineWalletHistoryPageQuery } from './get-engine-wallet-history-page.query';

jest.mock('../../infrastructure/clients/engine-wallet-history.client', () => ({
  fetchEngineWalletHistory: jest.fn(),
}));

const { fetchEngineWalletHistory } = jest.requireMock(
  '../../infrastructure/clients/engine-wallet-history.client',
) as { fetchEngineWalletHistory: jest.Mock };

describe('getEngineWalletHistoryPageQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty page for not found account', async () => {
    fetchEngineWalletHistory.mockResolvedValue({ status: 'not_found' });
    const result = await getEngineWalletHistoryPageQuery('missing');
    expect(result.error).toBeNull();
    expect(result.page.items).toEqual([]);
    expect(result.page.hasMore).toBe(false);
  });

  it('maps API items to row views', async () => {
    fetchEngineWalletHistory.mockResolvedValue({
      status: 'ok',
      data: {
        items: [
          {
            id: 'swap:1',
            timestamp: '2024-01-01T00:00:00.000Z',
            operation: 'marketpools_swapTokens',
            kind: 'swap',
            source: 'swap',
            payload: {
              symbolIn: 'WAIV',
              symbolOut: 'SWAP.HIVE',
              symbolInQuantity: '1',
              symbolOutQuantity: '0.1',
            },
          },
        ],
        cursor: null,
        hasMore: false,
      },
    });
    const result = await getEngineWalletHistoryPageQuery('alice');
    expect(result.error).toBeNull();
    expect(result.page.items[0]).toMatchObject({
      kind: 'swap',
    });
  });
});
