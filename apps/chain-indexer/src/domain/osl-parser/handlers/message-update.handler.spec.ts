import { CHANNEL_KINDS } from '@opden-data-layer/core';
import { MessageUpdateHandler } from './message-update.handler';
import type { ChannelsRepository } from '../../../repositories/channels.repository';
import type { MessagesRepository } from '../../../repositories/messages.repository';
import type { ObjectsCoreRepository } from '../../../repositories/objects-core.repository';

describe('MessageUpdateHandler linked_object_ids', () => {
  const baseCtx = {
    action: 'message_update',
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

  it('replaces linked_object_ids from the new body on object channels', async () => {
    const messages = {
      tombstoneExists: jest.fn().mockResolvedValue(false),
      findById: jest.fn().mockResolvedValue({
        message_id: 'm1',
        channel_id: 'obj-ch-rest',
        author: 'alice',
        encrypted_body: null,
        linked_object_ids: ['dish-1'],
      }),
      updateBody: jest.fn().mockResolvedValue(undefined),
    } as unknown as MessagesRepository;

    const channels = {
      findById: jest.fn().mockResolvedValue({
        channel_id: 'obj-ch-rest',
        kind: CHANNEL_KINDS[2],
        object_id: 'rest-1',
      }),
    } as unknown as ChannelsRepository;

    const objectsCore = {
      findObjectTypesByIds: jest.fn().mockResolvedValue(
        new Map([
          ['dish-2', 'dish'],
          ['rest-1', 'restaurant'],
        ]),
      ),
    } as unknown as ObjectsCoreRepository;

    const handler = new MessageUpdateHandler(messages, channels, objectsCore);

    await handler.handle(
      {
        message_id: 'm1',
        channel_id: 'obj-ch-rest',
        body: 'now /object/dish-2',
      },
      baseCtx,
    );

    expect(messages.updateBody).toHaveBeenCalledWith(
      expect.objectContaining({
        linked_object_ids: ['dish-2'],
      }),
    );
  });

  it('clears linked_object_ids when body no longer mentions objects', async () => {
    const messages = {
      tombstoneExists: jest.fn().mockResolvedValue(false),
      findById: jest.fn().mockResolvedValue({
        message_id: 'm1',
        channel_id: 'obj-ch-rest',
        author: 'alice',
        encrypted_body: null,
        linked_object_ids: ['dish-1'],
      }),
      updateBody: jest.fn().mockResolvedValue(undefined),
    } as unknown as MessagesRepository;

    const channels = {
      findById: jest.fn().mockResolvedValue({
        channel_id: 'obj-ch-rest',
        kind: CHANNEL_KINDS[2],
        object_id: 'rest-1',
      }),
    } as unknown as ChannelsRepository;

    const objectsCore = {
      findObjectTypesByIds: jest.fn(),
    } as unknown as ObjectsCoreRepository;

    const handler = new MessageUpdateHandler(messages, channels, objectsCore);

    await handler.handle(
      {
        message_id: 'm1',
        channel_id: 'obj-ch-rest',
        body: 'no links',
      },
      baseCtx,
    );

    expect(objectsCore.findObjectTypesByIds).not.toHaveBeenCalled();
    expect(messages.updateBody).toHaveBeenCalledWith(
      expect.objectContaining({
        linked_object_ids: [],
      }),
    );
  });
});
