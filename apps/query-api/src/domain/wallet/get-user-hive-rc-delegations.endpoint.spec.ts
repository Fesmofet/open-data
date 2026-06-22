import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HiveClient, HiveNodeUnavailableError } from '@opden-data-layer/clients';

import { AccountsCurrentRepository, UserRcDelegationsRepository } from '../../repositories';
import { GetUserHiveRcDelegationsEndpoint } from './get-user-hive-rc-delegations.endpoint';

describe('GetUserHiveRcDelegationsEndpoint', () => {
  let endpoint: GetUserHiveRcDelegationsEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let userRcDelegations: jest.Mocked<Pick<UserRcDelegationsRepository, 'findRcDelegationsTo'>>;
  let hiveClient: jest.Mocked<Pick<HiveClient, 'listRcDirectDelegationsStrict'>>;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    userRcDelegations = { findRcDelegationsTo: jest.fn() };
    hiveClient = { listRcDirectDelegationsStrict: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserHiveRcDelegationsEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: UserRcDelegationsRepository, useValue: userRcDelegations },
        { provide: HiveClient, useValue: hiveClient },
      ],
    }).compile();

    endpoint = moduleRef.get(GetUserHiveRcDelegationsEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(null);
    await expect(endpoint.execute('ghost')).resolves.toBeNull();
  });

  it('maps indexed incoming and live outgoing delegations', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    userRcDelegations.findRcDelegationsTo.mockResolvedValue([
      { delegator: 'bob', delegatee: 'alice', rc: '1000000000' },
    ]);
    hiveClient.listRcDirectDelegationsStrict.mockResolvedValue([
      { from: 'alice', to: 'carol', delegated_rc: 2_000_000_000 },
    ]);

    const result = await endpoint.execute('alice');
    expect(result?.incoming).toEqual([
      { from: 'bob', to: 'alice', delegatedRc: 1_000_000_000 },
    ]);
    expect(result?.outgoing).toEqual([
      { from: 'alice', to: 'carol', delegatedRc: 2_000_000_000 },
    ]);
  });

  it('throws ServiceUnavailableException when Hive node is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    userRcDelegations.findRcDelegationsTo.mockResolvedValue([]);
    hiveClient.listRcDirectDelegationsStrict.mockRejectedValue(
      new HiveNodeUnavailableError(),
    );

    await expect(endpoint.execute('alice')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
