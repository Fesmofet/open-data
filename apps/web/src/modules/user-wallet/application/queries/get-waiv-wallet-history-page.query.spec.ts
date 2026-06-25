jest.mock('server-only', () => ({}));

import { getWaivWalletHistoryPageQuery } from './get-waiv-wallet-history-page.query';

jest.mock('../../infrastructure/clients/waiv-wallet-history.client', () => ({
  fetchWaivWalletHistory: jest.fn(),
}));

const { fetchWaivWalletHistory } = jest.requireMock(
  '../../infrastructure/clients/waiv-wallet-history.client',
) as { fetchWaivWalletHistory: jest.Mock };

describe('getWaivWalletHistoryPageQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty page for not found account', async () => {
    fetchWaivWalletHistory.mockResolvedValue({ status: 'not_found' });
    const result = await getWaivWalletHistoryPageQuery('missing');
    expect(result.error).toBeNull();
    expect(result.page.items).toEqual([]);
    expect(result.page.hasMore).toBe(false);
  });

  it('maps API items to row views', async () => {
    fetchWaivWalletHistory.mockResolvedValue({
      status: 'ok',
      data: {
        items: [
          {
            id: 'rpc:tx:1',
            timestamp: '2024-01-01T00:00:00.000Z',
            operation: 'tokens_transfer',
            kind: 'transfer',
            source: 'rpc',
            payload: {
              from: 'bob',
              to: 'alice',
              quantity: '1',
              symbol: 'WAIV',
            },
          },
        ],
        cursor: null,
        hasMore: false,
      },
    });
    const result = await getWaivWalletHistoryPageQuery('alice');
    expect(result.error).toBeNull();
    expect(result.page.items[0]).toMatchObject({
      kind: 'transfer',
      direction: 'in',
    });
  });
});
