import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CHANNEL_MEMBER_ROLES } from '@opden-data-layer/core';
import { ValidateChannelMembersEndpoint } from './validate-members.endpoint';
import type { MessagingRepository } from '../../repositories/messaging.repository';
import type { UserAccountMutesRepository } from '../../repositories/user-account-mutes.repository';
import type { GovernanceResolverService } from '../governance/governance-resolver.service';

describe('ValidateChannelMembersEndpoint', () => {
  const groupChannel = {
    channel_id: 'grp-1',
    kind: 'group',
    creator: 'alice',
    title: 'Team',
    image: null,
    object_id: null,
    pair_hash: null,
    access: 'members_only',
    last_message_at_unix: null,
    dissolved_at_unix: null,
    created_at_unix: 1,
    event_seq: BigInt(1),
    transaction_id: 'tx-0',
  };

  function makeEndpoint(overrides: {
    messaging?: Partial<MessagingRepository>;
    mutes?: Partial<UserAccountMutesRepository>;
    governance?: Partial<GovernanceResolverService>;
  } = {}) {
    const messaging = {
      findChannelById: jest.fn().mockResolvedValue(groupChannel),
      getMemberRole: jest.fn().mockResolvedValue(CHANNEL_MEMBER_ROLES[0]),
      listMembers: jest.fn().mockResolvedValue([
        { channel_id: 'grp-1', account: 'alice', role: 'admin', joined_at_unix: 1, last_read_at_unix: null },
      ]),
      ...overrides.messaging,
    } as unknown as MessagingRepository;

    const mutes = {
      muteExists: jest.fn().mockResolvedValue(false),
      ...overrides.mutes,
    } as unknown as UserAccountMutesRepository;

    const governance = {
      resolveMergedForObjectView: jest.fn().mockResolvedValue({ muted: [] }),
      ...overrides.governance,
    } as unknown as GovernanceResolverService;

    return {
      endpoint: new ValidateChannelMembersEndpoint(messaging, mutes, governance),
      messaging,
      mutes,
    };
  }

  it('returns addable true for eligible account', async () => {
    const { endpoint } = makeEndpoint();

    const result = await endpoint.execute('grp-1', 'alice', ['bob']);

    expect(result.results).toEqual([{ account: 'bob', addable: true }]);
  });

  it('returns muted_by_viewer when viewer muted target', async () => {
    const { endpoint, mutes } = makeEndpoint({
      mutes: {
        muteExists: jest.fn(async (muter: string, muted: string) =>
          muter === 'alice' && muted === 'bob',
        ),
      },
    });

    const result = await endpoint.execute('grp-1', 'alice', ['bob']);

    expect(result.results).toEqual([
      { account: 'bob', addable: false, reason: 'muted_by_viewer' },
    ]);
  });

  it('returns group_full when at cap', async () => {
    const members = Array.from({ length: 100 }, (_, index) => ({
      channel_id: 'grp-1',
      account: `user${index}`,
      role: 'member',
      joined_at_unix: 1,
      last_read_at_unix: null,
    }));
    const { endpoint } = makeEndpoint({
      messaging: { listMembers: jest.fn().mockResolvedValue(members) },
    });

    const result = await endpoint.execute('grp-1', 'alice', ['newbie']);

    expect(result.results).toEqual([
      { account: 'newbie', addable: false, reason: 'group_full' },
    ]);
  });

  it('throws 403 when viewer is not admin', async () => {
    const { endpoint } = makeEndpoint({
      messaging: { getMemberRole: jest.fn().mockResolvedValue('member') },
    });

    await expect(endpoint.execute('grp-1', 'bob', ['carol'])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws 404 for dissolved channel', async () => {
    const { endpoint } = makeEndpoint({
      messaging: {
        findChannelById: jest.fn().mockResolvedValue({
          ...groupChannel,
          dissolved_at_unix: 99,
        }),
      },
    });

    await expect(endpoint.execute('grp-1', 'alice', ['bob'])).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
