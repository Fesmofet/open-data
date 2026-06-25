import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

import { GetUserWaivWalletHistoryEndpoint } from './get-user-waiv-wallet-history.endpoint';

describe('GetUserWaivWalletHistoryEndpoint', () => {
  const accounts = { findByName: jest.fn() };
  const pager = { collectPage: jest.fn() };

  let endpoint: GetUserWaivWalletHistoryEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    endpoint = new GetUserWaivWalletHistoryEndpoint(
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

  it('returns pager result', async () => {
    pager.collectPage.mockResolvedValue({
      items: [{ id: 'rpc:1', operation: 'tokens_transfer' }],
      cursor: 'abc',
      hasMore: false,
      rpcUnavailable: false,
    });
    const result = await endpoint.execute('alice', { showRewards: true });
    expect(result?.items).toHaveLength(1);
    expect(pager.collectPage).toHaveBeenCalledWith(
      expect.objectContaining({ showRewards: true }),
    );
  });
});
