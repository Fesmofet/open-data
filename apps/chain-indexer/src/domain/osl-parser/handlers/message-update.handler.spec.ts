import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';

import { MessageUpdateHandler } from './message-update.handler';
import type { MessagesRepository } from '../../../repositories/messages.repository';

describe('MessageUpdateHandler', () => {
  const baseCtx = {
    action: 'message_update',
    creator: 'alice',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'tx-1',
    timestamp: '2024-01-15T12:01:40.000Z',
    eventSeq: BigInt(2),
    eventIdIndexMap: new Map<string, number>(),
  };

  const plainRow = {
    message_id: 'tx-0-0-0',
    channel_id: 'ch-1',
    author: 'alice',
    body: 'hello',
    encrypted_body: null,
    created_at_unix: 1_700_000_000,
    original_created_at_unix: 1_262_304_000,
    reply_to: 'parent-0-0-0',
  };

  function makeHandler(overrides: Partial<MessagesRepository> = {}) {
    const messages = {
      tombstoneExists: jest.fn().mockResolvedValue(false),
      findById: jest.fn().mockResolvedValue(plainRow),
      updateBody: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as MessagesRepository;

    return { handler: new MessageUpdateHandler(messages), messages };
  }

  it('author full-replace keeps metadata and sets updated_at_unix', async () => {
    const { handler, messages } = makeHandler();

    await handler.handle(
      { channel_id: 'ch-1', message_id: 'tx-0-0-0', body: 'hello edited' },
      baseCtx,
    );

    expect(messages.updateBody).toHaveBeenCalledWith({
      message_id: 'tx-0-0-0',
      body: 'hello edited',
      updated_at_unix: blockTimestampToUnixSeconds(baseCtx.timestamp),
    });
  });

  it('skips when non-author updates', async () => {
    const { handler, messages } = makeHandler();

    await handler.handle(
      { channel_id: 'ch-1', message_id: 'tx-0-0-0', body: 'nope' },
      { ...baseCtx, creator: 'bob' },
    );

    expect(messages.updateBody).not.toHaveBeenCalled();
  });

  it('skips encrypted messages', async () => {
    const { handler, messages } = makeHandler({
      findById: jest.fn().mockResolvedValue({
        ...plainRow,
        body: null,
        encrypted_body: '#cipher',
      }),
    });

    await handler.handle(
      { channel_id: 'ch-1', message_id: 'tx-0-0-0', body: 'nope' },
      baseCtx,
    );

    expect(messages.updateBody).not.toHaveBeenCalled();
  });

  it('skips when message is missing', async () => {
    const { handler, messages } = makeHandler({
      findById: jest.fn().mockResolvedValue(null),
    });

    await handler.handle(
      { channel_id: 'ch-1', message_id: 'tx-0-0-0', body: 'nope' },
      baseCtx,
    );

    expect(messages.updateBody).not.toHaveBeenCalled();
  });

  it('skips when message is in a different channel', async () => {
    const { handler, messages } = makeHandler({
      findById: jest.fn().mockResolvedValue({
        ...plainRow,
        channel_id: 'ch-1',
      }),
    });

    await handler.handle(
      { channel_id: 'ch-2', message_id: 'tx-0-0-0', body: 'nope' },
      baseCtx,
    );

    expect(messages.updateBody).not.toHaveBeenCalled();
  });

  it('only calls updateBody on successful author update', async () => {
    const { handler, messages } = makeHandler();

    await handler.handle(
      { channel_id: 'ch-1', message_id: 'tx-0-0-0', body: 'hello edited' },
      baseCtx,
    );

    expect(messages.updateBody).toHaveBeenCalledTimes(1);
    expect(messages).not.toHaveProperty('insertMessage');
    expect(messages).not.toHaveProperty('deleteAndTombstone');
  });

  it('skips when tombstone exists', async () => {
    const { handler, messages } = makeHandler({
      tombstoneExists: jest.fn().mockResolvedValue(true),
    });

    await handler.handle(
      { channel_id: 'ch-1', message_id: 'tx-0-0-0', body: 'nope' },
      baseCtx,
    );

    expect(messages.updateBody).not.toHaveBeenCalled();
    expect(messages.findById).not.toHaveBeenCalled();
  });
});
