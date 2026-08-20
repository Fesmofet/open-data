import { CHANNEL_KINDS } from '@opden-data-layer/core';
import { MessageCreateHandler } from './message-create.handler';
import type { ChannelsRepository } from '../../../repositories/channels.repository';
import type { MessagesRepository } from '../../../repositories/messages.repository';
import type { NotificationEmitterService } from '../../notification-adapter/notification-emitter.service';

describe('MessageCreateHandler notifications', () => {
  const baseCtx = {
    action: 'message_create',
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

  function makeHandler(overrides: {
    channels?: Partial<ChannelsRepository>;
    messages?: Partial<MessagesRepository>;
    notificationEmitter?: Partial<NotificationEmitterService>;
  } = {}) {
    const channels = {
      findById: jest.fn(),
      isMember: jest.fn().mockResolvedValue(true),
      runInTransaction: jest.fn(async (fn: (trx: unknown) => Promise<void>) => fn({})),
      updateLastMessageAt: jest.fn().mockResolvedValue(undefined),
      ...overrides.channels,
    } as unknown as ChannelsRepository;

    const messages = {
      tombstoneExists: jest.fn().mockResolvedValue(false),
      findById: jest.fn().mockResolvedValue(null),
      insertMessage: jest.fn().mockResolvedValue(undefined),
      ...overrides.messages,
    } as unknown as MessagesRepository;

    const notificationEmitter = {
      odlContext: jest.fn().mockReturnValue({
        blockNum: 1,
        trxId: 'tx-1',
        occurredAt: '2024-01-15T12:00:00.000Z',
      }),
      emitWithContext: jest.fn(),
      ...overrides.notificationEmitter,
    } as unknown as NotificationEmitterService;

    return {
      handler: new MessageCreateHandler(channels, messages, notificationEmitter),
      channels,
      messages,
      notificationEmitter,
    };
  }

  it('emits message_direct after commit for DM channels', async () => {
    const { handler, channels, notificationEmitter } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          channel_id: 'dm-1',
          kind: CHANNEL_KINDS[0],
          object_id: null,
          title: null,
          dissolved_at_unix: null,
        }),
      },
    });

    await handler.handle({ channel_id: 'dm-1', body: 'hello' }, baseCtx);

    expect(notificationEmitter.emitWithContext).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'message_direct',
        actor: 'alice',
        payload: expect.objectContaining({
          channelId: 'dm-1',
          author: 'alice',
          encrypted: false,
        }),
      }),
    );
  });

  it('emits message_group with channel title after commit', async () => {
    const { handler, notificationEmitter } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          channel_id: 'grp-1',
          kind: CHANNEL_KINDS[1],
          object_id: null,
          title: 'Team chat',
          dissolved_at_unix: null,
        }),
      },
    });

    await handler.handle({ channel_id: 'grp-1', body: 'hello' }, baseCtx);

    expect(notificationEmitter.emitWithContext).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'message_group',
        payload: expect.objectContaining({
          channelTitle: 'Team chat',
          encrypted: false,
        }),
      }),
    );
  });

  it('emits bell_object_message for object channels', async () => {
    const { handler, notificationEmitter } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          channel_id: 'obj-ch-1',
          kind: CHANNEL_KINDS[2],
          object_id: 'obj-1',
          title: null,
          dissolved_at_unix: null,
        }),
      },
    });

    await handler.handle(
      {
        channel_id: 'obj-ch-1',
        encrypted_body: '#encrypted',
        encryption: { v: 1, mode: 'memo', to: 'bob' },
      },
      baseCtx,
    );

    expect(notificationEmitter.emitWithContext).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'bell_object_message',
        objectId: 'obj-1',
        payload: expect.objectContaining({
          encrypted: true,
        }),
      }),
    );
  });

  it('does not emit when channel is dissolved', async () => {
    const { handler, notificationEmitter } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          channel_id: 'dm-1',
          kind: CHANNEL_KINDS[0],
          object_id: null,
          title: null,
          dissolved_at_unix: 999,
        }),
      },
    });

    await handler.handle({ channel_id: 'dm-1', body: 'hello' }, baseCtx);

    expect(notificationEmitter.emitWithContext).not.toHaveBeenCalled();
  });

  it('does not emit when message already exists', async () => {
    const { handler, notificationEmitter } = makeHandler({
      channels: {
        findById: jest.fn().mockResolvedValue({
          channel_id: 'dm-1',
          kind: CHANNEL_KINDS[0],
          object_id: null,
          title: null,
          dissolved_at_unix: null,
        }),
      },
      messages: {
        findById: jest.fn().mockResolvedValue({ message_id: 'existing' }),
      },
    });

    await handler.handle({ channel_id: 'dm-1', body: 'hello' }, baseCtx);

    expect(notificationEmitter.emitWithContext).not.toHaveBeenCalled();
  });
});
