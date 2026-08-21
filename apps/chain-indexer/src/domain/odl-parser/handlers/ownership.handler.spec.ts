import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import type { OdlEventContext } from '../odl-action-handler';
import { OWNERSHIP_CHANGED_EVENT } from '../ownership-changed.event';
import { OwnershipHandler } from './ownership.handler';

const baseCtx: OdlEventContext = {
  action: 'object_ownership',
  creator: 'alice',
  blockNum: 10,
  transactionIndex: 0,
  operationIndex: 0,
  odlEventIndex: 0,
  transactionId: 'hive-trx-abc',
  timestamp: '2026-01-01T00:00:00.000Z',
  eventSeq: BigInt(7),
  eventIdIndexMap: new Map(),
};

describe('OwnershipHandler', () => {
  const objectId = 'obj-1';

  function createHandler(mocks: {
    findByObjectId?: jest.Mock;
    upsert?: jest.Mock;
    delete?: jest.Mock;
    emit?: jest.Mock;
  }) {
    return new OwnershipHandler(
      {
        findByObjectId:
          mocks.findByObjectId ??
          jest.fn().mockResolvedValue({ object_id: objectId, creator: 'creator' }),
      } as unknown as import('../../../repositories').ObjectsCoreRepository,
      {
        upsert: mocks.upsert ?? jest.fn().mockResolvedValue(undefined),
        delete: mocks.delete ?? jest.fn().mockResolvedValue(undefined),
      } as unknown as import('../../../repositories').ObjectOwnershipRepository,
      {
        emit: mocks.emit ?? jest.fn(),
      } as unknown as import('@nestjs/event-emitter').EventEmitter2,
    );
  }

  it('add — upserts ownership with type and emits event', async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const handler = createHandler({ upsert, emit });

    await handler.handle(
      { object_id: objectId, method: 'add', ownership_type: 'exclusive' },
      baseCtx,
    );

    expect(upsert).toHaveBeenCalledWith({
      object_id: objectId,
      account: 'alice',
      ownership_type: 'exclusive',
      event_seq: BigInt(7),
      created_at: hiveBlockTimestampToDate(baseCtx.timestamp),
    });
    expect(emit).toHaveBeenCalledWith(
      OWNERSHIP_CHANGED_EVENT,
      expect.objectContaining({ account: 'alice' }),
    );
  });

  it('add — unknown object skips upsert', async () => {
    const upsert = jest.fn();
    const handler = createHandler({
      upsert,
      findByObjectId: jest.fn().mockResolvedValue(null),
    });

    await handler.handle(
      { object_id: objectId, method: 'add', ownership_type: 'supervised' },
      baseCtx,
    );

    expect(upsert).not.toHaveBeenCalled();
  });

  it('remove — deletes ownership and emits event', async () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const handler = createHandler({ delete: deleteFn, emit });

    await handler.handle({ object_id: objectId, method: 'remove' }, baseCtx);

    expect(deleteFn).toHaveBeenCalledWith(objectId, 'alice');
    expect(emit).toHaveBeenCalledWith(
      OWNERSHIP_CHANGED_EVENT,
      expect.objectContaining({ account: 'alice' }),
    );
  });

  it('ignores invalid payload', async () => {
    const upsert = jest.fn();
    const handler = createHandler({ upsert });

    await handler.handle({ object_id: '', method: 'add' }, baseCtx);

    expect(upsert).not.toHaveBeenCalled();
  });
});
