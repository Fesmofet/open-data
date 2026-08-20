import { CHANNEL_KINDS, CHANNEL_MEMBER_ROLES } from '@opden-data-layer/core';
import { ChannelMemberAddHandler } from './channel-member-add.handler';
import type { ChannelsRepository } from '../../../repositories/channels.repository';
import type { SocialGraphRepository } from '../../../repositories';
import type { GovernanceResolverService } from '../../governance/governance-resolver.service';

describe('ChannelMemberAddHandler', () => {
  const baseCtx = {
    action: 'channel_member_add',
    creator: 'alice',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'tx-1',
    timestamp: '2024-01-15T12:00:00.000Z',
    eventSeq: BigInt(1),
    eventIdIndexMap: new Map<string, number>(),
  };

  const groupChannel = {
    channel_id: 'grp-1',
    kind: CHANNEL_KINDS[1],
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

  function makeHandler(overrides: {
    channels?: Partial<ChannelsRepository>;
    socialGraph?: Partial<SocialGraphRepository>;
    governance?: Partial<GovernanceResolverService>;
  } = {}) {
    const channels = {
      findById: jest.fn().mockResolvedValue(groupChannel),
      getMemberRole: jest.fn().mockResolvedValue(CHANNEL_MEMBER_ROLES[0]),
      isMember: jest.fn().mockResolvedValue(false),
      countMembers: jest.fn().mockResolvedValue(2),
      insertMember: jest.fn().mockResolvedValue(undefined),
      ...overrides.channels,
    } as unknown as ChannelsRepository;

    const socialGraph = {
      muteExists: jest.fn().mockResolvedValue(false),
      ...overrides.socialGraph,
    } as unknown as SocialGraphRepository;

    const governance = {
      resolveMergedForObjectView: jest.fn().mockResolvedValue({ muted: [] }),
      ...overrides.governance,
    } as unknown as GovernanceResolverService;

    return {
      handler: new ChannelMemberAddHandler(channels, socialGraph, governance),
      channels,
      socialGraph,
      governance,
    };
  }

  it('inserts eligible member when admin adds', async () => {
    const { handler, channels } = makeHandler();

    await handler.handle({ channel_id: 'grp-1', account: 'bob' }, baseCtx);

    expect(channels.insertMember).toHaveBeenCalledWith(
      expect.objectContaining({ channel_id: 'grp-1', account: 'bob', role: 'member' }),
    );
  });

  it('skips when target muted adder', async () => {
    const { handler, channels, socialGraph } = makeHandler({
      socialGraph: {
        muteExists: jest.fn(async (muter: string, muted: string) =>
          muter === 'bob' && muted === 'alice',
        ),
      },
    });

    await handler.handle({ channel_id: 'grp-1', account: 'bob' }, baseCtx);

    expect(channels.insertMember).not.toHaveBeenCalled();
  });

  it('skips when group is at member cap', async () => {
    const { handler, channels } = makeHandler({
      channels: { countMembers: jest.fn().mockResolvedValue(100) },
    });

    await handler.handle({ channel_id: 'grp-1', account: 'bob' }, baseCtx);

    expect(channels.insertMember).not.toHaveBeenCalled();
  });

  it('skips when channel is dissolved', async () => {
    const { handler, channels } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          ...groupChannel,
          dissolved_at_unix: 999,
        }),
      },
    });

    await handler.handle({ channel_id: 'grp-1', account: 'bob' }, baseCtx);

    expect(channels.insertMember).not.toHaveBeenCalled();
  });

  it('skips when channel is object kind', async () => {
    const { handler, channels } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          ...groupChannel,
          channel_id: 'obj-ch-1',
          kind: CHANNEL_KINDS[2],
          object_id: 'obj-1',
        }),
      },
    });

    await handler.handle({ channel_id: 'obj-ch-1', account: 'bob' }, baseCtx);

    expect(channels.insertMember).not.toHaveBeenCalled();
  });

  it('skips when target already member', async () => {
    const { handler, channels } = makeHandler({
      channels: { isMember: jest.fn().mockResolvedValue(true) },
    });

    await handler.handle({ channel_id: 'grp-1', account: 'bob' }, baseCtx);

    expect(channels.insertMember).not.toHaveBeenCalled();
  });
});
