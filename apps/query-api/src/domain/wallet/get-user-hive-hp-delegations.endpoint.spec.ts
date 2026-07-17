import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HiveClient, HiveNodeUnavailableError } from '@opden-data-layer/clients';

import { AccountsCurrentRepository, UserDelegationsRepository } from '../../repositories';
import { HiveGlobalPropertiesCache } from '../feed/hive-global-properties.cache';
import { GetUserHiveHpDelegationsEndpoint } from './get-user-hive-hp-delegations.endpoint';

describe('GetUserHiveHpDelegationsEndpoint', () => {
  let endpoint: GetUserHiveHpDelegationsEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let userDelegations: jest.Mocked<
    Pick<UserDelegationsRepository, 'findHpDelegationsTo' | 'findHpDelegationsFrom'>
  >;
  let hiveClient: jest.Mocked<
    Pick<HiveClient, 'findVestingDelegationExpirationsStrict'>
  >;
  let hiveGlobalProperties: jest.Mocked<Pick<HiveGlobalPropertiesCache, 'getChainContextFields'>>;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    userDelegations = {
      findHpDelegationsTo: jest.fn(),
      findHpDelegationsFrom: jest.fn(),
    };
    hiveClient = {
      findVestingDelegationExpirationsStrict: jest.fn(),
    };
    hiveGlobalProperties = { getChainContextFields: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserHiveHpDelegationsEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: UserDelegationsRepository, useValue: userDelegations },
        { provide: HiveClient, useValue: hiveClient },
        { provide: HiveGlobalPropertiesCache, useValue: hiveGlobalProperties },
      ],
    }).compile();

    endpoint = moduleRef.get(GetUserHiveHpDelegationsEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    await expect(endpoint.execute('ghost')).resolves.toBeNull();
  });

  it('maps indexed incoming, outgoing, and expirations', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveGlobalProperties.getChainContextFields.mockResolvedValue({
      totalVestingShares: '1000000000.000000 VESTS',
      totalVestingFundSteem: '1000000.000000 STEEM',
      hbdInterestRatePercent: 0,
    });
    userDelegations.findHpDelegationsFrom.mockResolvedValue([
      {
        delegator: 'alice',
        delegatee: 'bob',
        vesting_shares: 1000,
        delegation_date: new Date('2020-01-01T00:00:00Z'),
      },
    ]);
    userDelegations.findHpDelegationsTo.mockResolvedValue([
      {
        delegator: 'carol',
        delegatee: 'alice',
        vesting_shares: 500,
        delegation_date: new Date('2020-01-02T00:00:00Z'),
      },
    ]);
    hiveClient.findVestingDelegationExpirationsStrict.mockResolvedValue([
      {
        delegator: 'alice',
        vesting_shares: '100.000000 VESTS',
        completion_date: '2026-07-01T00:00:00',
      },
    ]);

    const result = await endpoint.execute('alice');
    expect(result?.incoming).toHaveLength(1);
    expect(result?.incoming[0]?.delegator).toBe('carol');
    expect(result?.outgoing).toHaveLength(1);
    expect(result?.outgoing[0]?.delegatee).toBe('bob');
    expect(result?.expirations).toHaveLength(1);
    expect(result?.expirations[0]?.completionDate).toBe('2026-07-01T00:00:00');
  });

  it('throws ServiceUnavailableException when Hive node is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    userDelegations.findHpDelegationsTo.mockResolvedValue([]);
    userDelegations.findHpDelegationsFrom.mockResolvedValue([]);
    hiveClient.findVestingDelegationExpirationsStrict.mockRejectedValue(
      new HiveNodeUnavailableError(),
    );

    await expect(endpoint.execute('alice')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
