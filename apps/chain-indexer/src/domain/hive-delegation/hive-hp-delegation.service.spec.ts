import { Test } from '@nestjs/testing';
import { UserDelegationsRepository } from '../../repositories/user-delegations.repository';
import { HiveHpDelegationService } from './hive-hp-delegation.service';

describe('HiveHpDelegationService', () => {
  let service: HiveHpDelegationService;
  let repo: jest.Mocked<
    Pick<UserDelegationsRepository, 'upsertHpDelegation' | 'deleteHpDelegation'>
  >;

  beforeEach(async () => {
    repo = {
      upsertHpDelegation: jest.fn(),
      deleteHpDelegation: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        HiveHpDelegationService,
        { provide: UserDelegationsRepository, useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(HiveHpDelegationService);
  });

  it('upserts delegation with parsed vesting shares', async () => {
    await service.handleDelegateVestingShares(
      {
        delegator: 'Alice',
        delegatee: 'Bob',
        vesting_shares: '46.130000 VESTS',
      },
      { timestamp: '2024-01-01T00:00:00', blockNum: 1, transactionIndex: 0, operationIndex: 0, transaction: {} as never },
    );

    expect(repo.upsertHpDelegation).toHaveBeenCalledWith({
      delegator: 'alice',
      delegatee: 'bob',
      vesting_shares: 46.13,
      delegation_date: new Date('2024-01-01T00:00:00'),
    });
  });

  it('deletes delegation when vesting shares are zero', async () => {
    await service.handleDelegateVestingShares(
      {
        delegator: 'alice',
        delegatee: 'bob',
        vesting_shares: '0.000000 VESTS',
      },
      { timestamp: '2024-01-01T00:00:00', blockNum: 1, transactionIndex: 0, operationIndex: 0, transaction: {} as never },
    );

    expect(repo.deleteHpDelegation).toHaveBeenCalledWith('alice', 'bob');
    expect(repo.upsertHpDelegation).not.toHaveBeenCalled();
  });
});
