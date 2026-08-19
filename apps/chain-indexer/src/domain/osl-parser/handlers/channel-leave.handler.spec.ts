import { CHANNEL_KINDS, CHANNEL_MEMBER_ROLES } from '@opden-data-layer/core';
import { ChannelLeaveHandler } from './channel-leave.handler';
import type { ChannelsRepository } from '../../../repositories/channels.repository';
import type { MessagesRepository } from '../../../repositories/messages.repository';

describe('ChannelLeaveHandler', () => {
  const baseCtx = {
    action: 'channel_leave',
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

  function makeRepos(overrides: {
    channels?: Partial<ChannelsRepository>;
    messages?: Partial<MessagesRepository>;
  } = {}) {
    const channels = {
      findById: jest.fn().mockResolvedValue(groupChannel),
      getMemberRole: jest.fn().mockResolvedValue(CHANNEL_MEMBER_ROLES[1]),
      countMembers: jest.fn().mockResolvedValue(2),
      countAdmins: jest.fn().mockResolvedValue(1),
      isMember: jest.fn().mockResolvedValue(true),
      runInTransaction: jest.fn(async (fn: (trx: unknown) => Promise<void>) => fn({})),
      updateMemberRole: jest.fn().mockResolvedValue(undefined),
      removeMember: jest.fn().mockResolvedValue(undefined),
      dissolveChannel: jest.fn().mockResolvedValue(undefined),
      ...overrides.channels,
    } as unknown as ChannelsRepository;

    const messages = {
      deleteAllByAuthorInChannel: jest.fn().mockResolvedValue(undefined),
      ...overrides.messages,
    } as unknown as MessagesRepository;

    return { channels, messages };
  }

  it('removes non-admin member from group', async () => {
    const { channels, messages } = makeRepos();
    const handler = new ChannelLeaveHandler(channels, messages);

    await handler.handle({ channel_id: 'grp-1' }, baseCtx);

    expect(channels.removeMember).toHaveBeenCalledWith('grp-1', 'alice', expect.anything());
    expect(channels.dissolveChannel).not.toHaveBeenCalled();
    expect(messages.deleteAllByAuthorInChannel).not.toHaveBeenCalled();
  });

  it('promotes successor when sole admin leaves with 2+ members', async () => {
    const { channels, messages } = makeRepos({
      channels: {
        getMemberRole: jest.fn().mockResolvedValue(CHANNEL_MEMBER_ROLES[0]),
        countMembers: jest.fn().mockResolvedValue(2),
        countAdmins: jest.fn().mockResolvedValue(1),
      },
    });
    const handler = new ChannelLeaveHandler(channels, messages);

    await handler.handle(
      { channel_id: 'grp-1', successor_admin: 'bob' },
      baseCtx,
    );

    expect(channels.updateMemberRole).toHaveBeenCalledWith(
      'grp-1',
      'bob',
      CHANNEL_MEMBER_ROLES[0],
      expect.anything(),
    );
    expect(channels.removeMember).toHaveBeenCalledWith('grp-1', 'alice', expect.anything());
  });

  it('skips sole admin leave without successor when 2+ members', async () => {
    const { channels } = makeRepos({
      channels: {
        getMemberRole: jest.fn().mockResolvedValue(CHANNEL_MEMBER_ROLES[0]),
        countMembers: jest.fn().mockResolvedValue(3),
        countAdmins: jest.fn().mockResolvedValue(1),
      },
    });
    const handler = new ChannelLeaveHandler(channels, {} as MessagesRepository);

    await handler.handle({ channel_id: 'grp-1' }, baseCtx);

    expect(channels.removeMember).not.toHaveBeenCalled();
  });

  it('dissolves channel when last member leaves', async () => {
    const { channels } = makeRepos({
      channels: {
        getMemberRole: jest.fn().mockResolvedValue(CHANNEL_MEMBER_ROLES[0]),
        countMembers: jest.fn().mockResolvedValue(1),
        countAdmins: jest.fn().mockResolvedValue(1),
      },
    });
    const handler = new ChannelLeaveHandler(channels, {} as MessagesRepository);

    await handler.handle({ channel_id: 'grp-1' }, baseCtx);

    expect(channels.dissolveChannel).toHaveBeenCalledWith(
      'grp-1',
      expect.any(Number),
      expect.anything(),
    );
    expect(channels.removeMember).toHaveBeenCalledWith('grp-1', 'alice', expect.anything());
  });

  it('deletes author messages when delete_my_messages is true', async () => {
    const { channels, messages } = makeRepos();
    const handler = new ChannelLeaveHandler(channels, messages);

    await handler.handle(
      { channel_id: 'grp-1', delete_my_messages: true },
      baseCtx,
    );

    expect(messages.deleteAllByAuthorInChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'grp-1',
        author: 'alice',
        deletedBy: 'alice',
      }),
      expect.anything(),
    );
  });

  it('skips direct channels', async () => {
    const { channels } = makeRepos({
      channels: {
        findById: jest.fn().mockResolvedValue({
          ...groupChannel,
          kind: CHANNEL_KINDS[0],
        }),
      },
    });
    const handler = new ChannelLeaveHandler(channels, {} as MessagesRepository);

    await handler.handle({ channel_id: 'dm-1' }, baseCtx);

    expect(channels.removeMember).not.toHaveBeenCalled();
  });
});
