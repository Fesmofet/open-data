import type { ValidityVote } from '@opden-data-layer/core';
import { DEFAULT_GOVERNANCE_SNAPSHOT } from '@opden-data-layer/objects-domain';

import { GetUpdateVotersEndpoint } from './get-update-voters.endpoint';

describe('GetUpdateVotersEndpoint', () => {
  const objectUpdates = {
    find: jest.fn(),
  };
  const updatesFeedRepo = {
    findValidityVotesForObjectAndUpdates: jest.fn(),
    findWaivPowersByAccounts: jest.fn(),
  };
  const accounts = {
    findByNames: jest.fn(),
  };
  const objectAuthorityRepo = {
    findByObjectId: jest.fn(),
  };
  const governanceResolver = {
    resolveMergedForObjectView: jest.fn(),
  };

  const endpoint = new GetUpdateVotersEndpoint(
    objectUpdates as never,
    updatesFeedRepo as never,
    accounts as never,
    objectAuthorityRepo as never,
    governanceResolver as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    governanceResolver.resolveMergedForObjectView.mockResolvedValue({
      ...DEFAULT_GOVERNANCE_SNAPSHOT,
      admins: ['alice'],
      trusted: ['carol'],
    });
    objectAuthorityRepo.findByObjectId.mockResolvedValue([
      {
        object_id: 'obj1',
        account: 'carol',
        authority_type: 'ownership',
        created_at: new Date(0),
      },
    ]);
    updatesFeedRepo.findWaivPowersByAccounts.mockResolvedValue(
      new Map([
        ['alice', 1_000_000],
        ['bob', 500_000],
        ['carol', 2_000_000],
      ]),
    );
  });

  it('returns null when update does not exist for object', async () => {
    objectUpdates.find.mockResolvedValue([]);
    await expect(
      endpoint.execute({ objectId: 'obj1', updateId: 'missing' }),
    ).resolves.toBeNull();
  });

  it('returns for/against voter rows with profiles and privileged tiers', async () => {
    objectUpdates.find.mockResolvedValue([{ update_id: 'u1', object_id: 'obj1' }]);
    updatesFeedRepo.findValidityVotesForObjectAndUpdates.mockResolvedValue([
      {
        update_id: 'u1',
        object_id: 'obj1',
        voter: 'alice',
        vote: 'for',
        event_seq: BigInt(2),
        transaction_id: 'tx1',
      },
      {
        update_id: 'u1',
        object_id: 'obj1',
        voter: 'bob',
        vote: 'against',
        event_seq: BigInt(1),
        transaction_id: 'tx2',
      },
      {
        update_id: 'u1',
        object_id: 'obj1',
        voter: 'carol',
        vote: 'for',
        event_seq: BigInt(3),
        transaction_id: 'tx3',
      },
    ] satisfies ValidityVote[]);
    accounts.findByNames.mockResolvedValue([
      {
        name: 'alice',
        alias: 'Alice',
        posting_json_metadata: '{}',
        profile_image: null,
        followers_count: 0,
        users_following_count: 0,
        post_count: 0,
        object_reputation: 0,
      },
    ]);

    const result = await endpoint.execute({ objectId: 'obj1', updateId: 'u1' });
    expect(result).toEqual({
      for_count: 2,
      against_count: 1,
      for_voters: [
        {
          voter: 'carol',
          event_seq: '3',
          waiv_power: 2_000_000,
          privileged_tier: 'trusted',
          profile: {
            name: 'carol',
            displayName: null,
            avatarUrl: null,
          },
        },
        {
          voter: 'alice',
          event_seq: '2',
          waiv_power: 1_000_000,
          privileged_tier: 'admin',
          profile: {
            name: 'alice',
            displayName: 'Alice',
            avatarUrl: null,
          },
        },
      ],
      against_voters: [
        {
          voter: 'bob',
          event_seq: '1',
          waiv_power: 500_000,
          privileged_tier: null,
          profile: {
            name: 'bob',
            displayName: null,
            avatarUrl: null,
          },
        },
      ],
    });
  });
});
