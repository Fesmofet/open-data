import { Test } from '@nestjs/testing';
import { UserRcDelegationsRepository } from '../../repositories/user-rc-delegations.repository';
import { HiveRcDelegationService } from './hive-rc-delegation.service';

describe('HiveRcDelegationService', () => {
  let service: HiveRcDelegationService;
  let repo: jest.Mocked<
    Pick<UserRcDelegationsRepository, 'upsertRcDelegation' | 'removeRcDelegations'>
  >;

  beforeEach(async () => {
    repo = {
      upsertRcDelegation: jest.fn(),
      removeRcDelegations: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        HiveRcDelegationService,
        { provide: UserRcDelegationsRepository, useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(HiveRcDelegationService);
  });

  it('upserts RC delegation rows', async () => {
    await service.handleRcCustomJson({
      id: 'rc',
      json: JSON.stringify([
        'delegate_rc',
        { from: 'alice', delegatees: ['bob', 'carol'], max_rc: 1_000_000_000 },
      ]),
      required_auths: [],
      required_posting_auths: ['alice'],
    });

    expect(repo.upsertRcDelegation).toHaveBeenCalledTimes(2);
    expect(repo.upsertRcDelegation).toHaveBeenCalledWith({
      delegator: 'alice',
      delegatee: 'bob',
      rc: '1000000000',
    });
  });

  it('uses posting auth when body.from differs from signer', async () => {
    await service.handleRcCustomJson({
      id: 'rc',
      json: JSON.stringify([
        'delegate_rc',
        { from: 'bob', delegatees: ['carol'], max_rc: 500 },
      ]),
      required_auths: [],
      required_posting_auths: ['alice'],
    });

    expect(repo.upsertRcDelegation).toHaveBeenCalledWith({
      delegator: 'alice',
      delegatee: 'carol',
      rc: '500',
    });
  });

  it('removes delegations when max_rc is zero', async () => {
    await service.handleRcCustomJson({
      id: 'rc',
      json: JSON.stringify([
        'delegate_rc',
        { from: 'alice', delegatees: ['bob'], max_rc: 0 },
      ]),
      required_auths: [],
      required_posting_auths: ['alice'],
    });

    expect(repo.removeRcDelegations).toHaveBeenCalledWith('alice', ['bob']);
    expect(repo.upsertRcDelegation).not.toHaveBeenCalled();
  });
});
