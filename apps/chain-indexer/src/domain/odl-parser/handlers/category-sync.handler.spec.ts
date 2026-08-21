import { buildUserScopeKey } from '@opden-data-layer/core';
import { CategorySyncHandler } from './category-sync.handler';
import { CategoryMutatedEvent } from '../category-mutated.event';
import { ObjectFavoriteChangedEvent } from '../object-favorite-changed.event';
import { ObjectFavorite } from '@opden-data-layer/odl-db-types';

describe('CategorySyncHandler', () => {
  it('enqueues object + global + user shop buckets + post authors on category mutated', async () => {
    const objectEnqueue = jest.fn().mockResolvedValue(undefined);
    const relatedEnqueue = jest.fn().mockResolvedValue(undefined);
    const findFavoritesByObjectId = jest.fn(
      async (): Promise<ObjectFavorite[]> => [
        {
          object_id: 'o1',
          account: 'shop',
          event_seq: BigInt(1),
          created_at: new Date(),
        },
      ],
    );
    const findOwnershipsByObjectId = jest.fn(async () => []);
    const findDistinctAuthorsByLinkedObject = jest.fn(async () => ['poster']);

    const handler = new CategorySyncHandler(
      {
        enqueue: objectEnqueue,
      } as never,
      {
        enqueue: relatedEnqueue,
      } as never,
      {
        findByObjectId: findFavoritesByObjectId,
      } as never,
      {
        findByObjectId: findOwnershipsByObjectId,
      } as never,
      {
        findDistinctAuthorsByLinkedObject,
      } as never,
    );

    await handler.handleCategoryMutated(new CategoryMutatedEvent('o1'));

    expect(objectEnqueue).toHaveBeenCalledWith(
      'o1',
      expect.any(Number),
    );
    expect(relatedEnqueue).toHaveBeenCalledWith('global', '_', expect.any(Number));

    expect(relatedEnqueue).toHaveBeenCalledWith(
      'user',
      buildUserScopeKey('shop', ['book', 'product']),
      expect.any(Number),
    );
    expect(relatedEnqueue).toHaveBeenCalledWith(
      'user',
      buildUserScopeKey('shop', ['recipe']),
      expect.any(Number),
    );
    expect(relatedEnqueue).toHaveBeenCalledWith(
      'user',
      buildUserScopeKey('poster', ['book', 'product']),
      expect.any(Number),
    );
    expect(relatedEnqueue).toHaveBeenCalledWith(
      'user',
      buildUserScopeKey('poster', ['recipe']),
      expect.any(Number),
    );

    expect(findDistinctAuthorsByLinkedObject).toHaveBeenCalledWith('o1');
  });

  it('enqueues shop buckets on object favorite change', async () => {
    const objectEnqueue = jest.fn();
    const relatedEnqueue = jest.fn().mockResolvedValue(undefined);
    const findFavoritesByObjectId = jest.fn();
    const findOwnershipsByObjectId = jest.fn();
    const findDistinctAuthorsByLinkedObject = jest.fn();

    const handler = new CategorySyncHandler(
      { enqueue: objectEnqueue } as never,
      {
        enqueue: relatedEnqueue,
      } as never,
      { findByObjectId: findFavoritesByObjectId } as never,
      { findByObjectId: findOwnershipsByObjectId } as never,
      { findDistinctAuthorsByLinkedObject } as never,
    );

    await handler.handleObjectFavoriteChanged(
      new ObjectFavoriteChangedEvent('merchant'),
    );

    expect(objectEnqueue).not.toHaveBeenCalled();
    expect(relatedEnqueue).toHaveBeenCalledTimes(2);
    expect(relatedEnqueue).toHaveBeenCalledWith(
      'user',
      buildUserScopeKey('merchant', ['book', 'product']),
      expect.any(Number),
    );
    expect(relatedEnqueue).toHaveBeenCalledWith(
      'user',
      buildUserScopeKey('merchant', ['recipe']),
      expect.any(Number),
    );
  });
});
