import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import type { NotificationRecipientsRepository } from '../../repositories/notification-recipients.repository';
import { ChannelMessagingRecipientStrategy } from './recipient-strategies';

describe('ChannelMessagingRecipientStrategy', () => {
  const recipientsRepository = {
    findChannelMembers: jest.fn(),
    findBellFollowers: jest.fn(),
  } as unknown as NotificationRecipientsRepository;

  const strategy = new ChannelMessagingRecipientStrategy(recipientsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes message_direct to channel members minus author', async () => {
    recipientsRepository.findChannelMembers = jest
      .fn()
      .mockResolvedValue(['alice', 'bob']);

    const recipients = await strategy.resolveRecipients({
      type: 'message_direct',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'tx-1',
      objectId: null,
      actor: 'alice',
      payload: {
        channelId: 'dm-1',
        messageId: 'msg-1',
        author: 'alice',
        encrypted: false,
      },
    } as AnyNotificationEvent);

    expect(recipients).toEqual(['bob']);
  });

  it('routes message_group to channel members minus author', async () => {
    recipientsRepository.findChannelMembers = jest
      .fn()
      .mockResolvedValue(['alice', 'bob', 'carol']);

    const recipients = await strategy.resolveRecipients({
      type: 'message_group',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'tx-1',
      objectId: null,
      actor: 'bob',
      payload: {
        channelId: 'grp-1',
        messageId: 'msg-2',
        author: 'bob',
        channelTitle: 'Team',
        encrypted: false,
      },
    } as AnyNotificationEvent);

    expect(recipients).toEqual(['alice', 'carol']);
  });

  it('routes bell_object_message to bell followers minus author', async () => {
    recipientsRepository.findBellFollowers = jest
      .fn()
      .mockResolvedValue(['alice', 'bob', 'carol']);

    const recipients = await strategy.resolveRecipients({
      type: 'bell_object_message',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'tx-1',
      objectId: 'obj-1',
      actor: 'alice',
      payload: {
        channelId: 'obj-ch-1',
        messageId: 'msg-3',
        author: 'alice',
        encrypted: false,
      },
    } as AnyNotificationEvent);

    expect(recipientsRepository.findBellFollowers).toHaveBeenCalledWith('obj-1');
    expect(recipients).toEqual(['bob', 'carol']);
  });

  it('returns empty recipients when objectId is missing for bell_object_message', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'bell_object_message',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'tx-1',
      objectId: null,
      actor: 'alice',
      payload: {
        channelId: 'obj-ch-1',
        messageId: 'msg-3',
        author: 'alice',
        encrypted: false,
      },
    } as AnyNotificationEvent);

    expect(recipients).toEqual([]);
  });

  it('supports only messaging notification types', () => {
    expect(strategy.supports('message_direct')).toBe(true);
    expect(strategy.supports('message_group')).toBe(true);
    expect(strategy.supports('bell_object_message')).toBe(true);
    expect(strategy.supports('follow')).toBe(false);
  });
});
