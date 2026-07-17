import { Test } from '@nestjs/testing';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { HiveEngineClient, HiveEngineUnavailableError } from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import { GetUserEngineTokenDelegationsEndpoint } from './get-user-engine-token-delegations.endpoint';

describe('GetUserEngineTokenDelegationsEndpoint', () => {
  let endpoint: GetUserEngineTokenDelegationsEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let hiveEngine: jest.Mocked<
    Pick<HiveEngineClient, 'findTokenDelegationsStrict'>
  >;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    hiveEngine = { findTokenDelegationsStrict: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserEngineTokenDelegationsEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: HiveEngineClient, useValue: hiveEngine },
      ],
    }).compile();

    endpoint = moduleRef.get(GetUserEngineTokenDelegationsEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    await expect(endpoint.execute('ghost', 'WAIV')).resolves.toBeNull();
  });

  it('throws BadRequestException for empty symbol', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    await expect(endpoint.execute('alice', '  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('normalizes symbol and maps delegation rows', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findTokenDelegationsStrict
      .mockResolvedValueOnce([
        {
          from: 'bob',
          to: 'alice',
          symbol: 'WAIV',
          quantity: '1',
          created: 1,
          updated: 2,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          from: 'alice',
          to: 'carol',
          symbol: 'WAIV',
          quantity: '2',
          created: 3,
          updated: 4,
        },
      ] as never);

    const result = await endpoint.execute('alice', ' waiv ');
    expect(result?.symbol).toBe('WAIV');
    expect(result?.incoming).toHaveLength(1);
    expect(result?.outgoing).toHaveLength(1);
    expect(result?.incoming[0]?.from).toBe('bob');
  });

  it('throws ServiceUnavailableException when Hive Engine is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findTokenDelegationsStrict.mockRejectedValue(
      new HiveEngineUnavailableError(),
    );

    await expect(endpoint.execute('alice', 'WAIV')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
