import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';
import { Test } from '@nestjs/testing';
import { UserDelegationsRepository } from '../../repositories/user-delegations.repository';
import { HiveHpDelegationService } from './hive-hp-delegation.service';

describe('HiveHpDelegationService', () => {
  let service: HiveHpDelegationService;
  let repo: jest.Mocked<
    Pick<UserDelegationsRepository, 'upsertHpDelegation' | 'deleteHpDelegation'>
  >;
  let emitWithContext: jest.Mock;
  let hiveContext: jest.Mock;

  const context = {
    timestamp: '2024-01-01T00:00:00',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    transaction: {} as never,
  };

  beforeEach(async () => {
    repo = {
      upsertHpDelegation: jest.fn(),
      deleteHpDelegation: jest.fn(),
    };
    emitWithContext = jest.fn();
    hiveContext = jest.fn().mockReturnValue({});

    const moduleRef = await Test.createTestingModule({
      providers: [
        HiveHpDelegationService,
        { provide: UserDelegationsRepository, useValue: repo },
        {
          provide: NotificationEmitterService,
          useValue: {
            emitWithContext,
            hiveContext,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(HiveHpDelegationService);
  });

  it('upserts delegation with parsed vesting shares and VESTS label', async () => {
    await service.handleDelegateVestingShares(
      {
        delegator: 'Alice',
        delegatee: 'Bob',
        vesting_shares: '46.130000 VESTS',
      },
      context,
    );

    expect(repo.upsertHpDelegation).toHaveBeenCalledWith({
      delegator: 'alice',
      delegatee: 'bob',
      vesting_shares: 46.13,
      delegation_date: new Date('2024-01-01T00:00:00.000Z'),
    });
    expect(emitWithContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'hp_delegation',
        payload: {
          delegator: 'alice',
          delegatee: 'bob',
          amount: '46.130000 VESTS',
        },
      }),
    );
  });

  it('deletes delegation and emits undelegation when vesting shares are zero', async () => {
    await service.handleDelegateVestingShares(
      {
        delegator: 'alice',
        delegatee: 'bob',
        vesting_shares: '0.000000 VESTS',
      },
      context,
    );

    expect(repo.deleteHpDelegation).toHaveBeenCalledWith('alice', 'bob');
    expect(repo.upsertHpDelegation).not.toHaveBeenCalled();
    expect(emitWithContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'hp_delegation',
        payload: {
          delegator: 'alice',
          delegatee: 'bob',
          amount: '0',
        },
      }),
    );
  });
});
