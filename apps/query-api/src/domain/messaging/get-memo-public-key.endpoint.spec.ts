import { NotFoundException } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';

import { GetMemoPublicKeyEndpoint } from './get-memo-public-key.endpoint';

describe('GetMemoPublicKeyEndpoint', () => {
  const hiveClient = {
    getAccounts: jest.fn(),
  } as unknown as jest.Mocked<Pick<HiveClient, 'getAccounts'>>;

  const endpoint = new GetMemoPublicKeyEndpoint(hiveClient as unknown as HiveClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns memo public key for existing account', async () => {
    hiveClient.getAccounts.mockResolvedValue([
      { name: 'alice', memo_key: 'STM8xxx' } as never,
    ]);
    await expect(endpoint.execute('alice')).resolves.toEqual({
      account: 'alice',
      memo_public_key: 'STM8xxx',
    });
  });

  it('throws 404 when account missing', async () => {
    hiveClient.getAccounts.mockResolvedValue([]);
    await expect(endpoint.execute('ghost')).rejects.toBeInstanceOf(NotFoundException);
  });
});
