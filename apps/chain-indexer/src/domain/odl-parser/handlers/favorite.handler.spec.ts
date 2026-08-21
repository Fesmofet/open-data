import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import type { OdlEventContext } from '../odl-action-handler';
import { OBJECT_FAVORITE_CHANGED_EVENT } from '../object-favorite-changed.event';
import { FavoriteHandler } from './favorite.handler';

const baseCtx: OdlEventContext = {
  action: 'object_favorite',
  creator: 'alice',
  blockNum: 10,
  transactionIndex: 0,
  operationIndex: 0,
  odlEventIndex: 0,
  transactionId: 'hive-trx-abc',
  timestamp: '2026-01-01T00:00:00.000Z',
  eventSeq: BigInt(42),
  eventIdIndexMap: new Map(),
};

describe('FavoriteHandler', () => {
  const objectId = 'obj-1';

  function createHandler(mocks: {
    findByObjectId?: jest.Mock;
    upsert?: jest.Mock;
    delete?: jest.Mock;
    shopDeselectRemove?: jest.Mock;
    onFavoriteAdded?: jest.Mock;
    onFavoriteRemoved?: jest.Mock;
    emit?: jest.Mock;
  }) {
    return new FavoriteHandler(
      {
        findByObjectId:
          mocks.findByObjectId ??
          jest.fn().mockResolvedValue({ object_id: objectId, creator: 'creator' }),
      } as unknown as import('../../../repositories').ObjectsCoreRepository,
      {
        upsert: mocks.upsert ?? jest.fn().mockResolvedValue(undefined),
        delete: mocks.delete ?? jest.fn().mockResolvedValue(undefined),
      } as unknown as import('../../../repositories').ObjectFavoriteRepository,
      {
        remove: mocks.shopDeselectRemove ?? jest.fn().mockResolvedValue(undefined),
      } as unknown as import('../../../repositories/user-shop-deselect.repository').UserShopDeselectRepository,
      {
        onFavoriteAdded: mocks.onFavoriteAdded ?? jest.fn().mockResolvedValue(undefined),
        onFavoriteRemoved: mocks.onFavoriteRemoved ?? jest.fn().mockResolvedValue(undefined),
      } as unknown as import('../object-favorite-reputation.service').ObjectFavoriteReputationService,
      {
        emit: mocks.emit ?? jest.fn(),
      } as unknown as import('@nestjs/event-emitter').EventEmitter2,
    );
  }

  it('add — upserts favorite, clears shop deselect, updates reputation, emits event', async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const shopDeselectRemove = jest.fn().mockResolvedValue(undefined);
    const onFavoriteAdded = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const handler = createHandler({ upsert, shopDeselectRemove, onFavoriteAdded, emit });

    await handler.handle({ object_id: objectId, method: 'add' }, baseCtx);

    expect(shopDeselectRemove).toHaveBeenCalledWith('alice', objectId);
    expect(onFavoriteAdded).toHaveBeenCalledWith(objectId, 'alice', 'creator');
    expect(upsert).toHaveBeenCalledWith({
      object_id: objectId,
      account: 'alice',
      event_seq: BigInt(42),
      created_at: hiveBlockTimestampToDate(baseCtx.timestamp),
    });
    expect(emit).toHaveBeenCalledWith(
      OBJECT_FAVORITE_CHANGED_EVENT,
      expect.objectContaining({ account: 'alice' }),
    );
  });

  it('add — unknown object skips upsert', async () => {
    const upsert = jest.fn();
    const handler = createHandler({
      upsert,
      findByObjectId: jest.fn().mockResolvedValue(null),
    });

    await handler.handle({ object_id: objectId, method: 'add' }, baseCtx);

    expect(upsert).not.toHaveBeenCalled();
  });

  it('remove — deletes favorite, updates reputation, emits event', async () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const onFavoriteRemoved = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const handler = createHandler({ delete: deleteFn, onFavoriteRemoved, emit });

    await handler.handle({ object_id: objectId, method: 'remove' }, baseCtx);

    expect(onFavoriteRemoved).toHaveBeenCalledWith(objectId, 'alice', 'creator');
    expect(deleteFn).toHaveBeenCalledWith(objectId, 'alice');
    expect(emit).toHaveBeenCalledWith(
      OBJECT_FAVORITE_CHANGED_EVENT,
      expect.objectContaining({ account: 'alice' }),
    );
  });

  it('ignores invalid payload', async () => {
    const upsert = jest.fn();
    const handler = createHandler({ upsert });

    await handler.handle({ object_id: objectId }, baseCtx);

    expect(upsert).not.toHaveBeenCalled();
  });
});
