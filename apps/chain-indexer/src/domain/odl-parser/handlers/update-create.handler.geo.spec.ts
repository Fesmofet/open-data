import { EventEmitter2 } from '@nestjs/event-emitter';
import { OBJECT_TYPES } from '@opden-data-layer/core';
import { UpdateCreateHandler } from './update-create.handler';
import type { OdlEventContext } from '../odl-action-handler';
import { WriteGuardRunner, GovernanceWriteGuard } from '../guards';
import {
  defaultUpdateCreateUserRefDeps,
  mockObjectsCore,
} from './update-create.handler.spec-helpers';
import { objectUpdateInsertValues } from '../../../repositories/object-update-insert-values';

describe('UpdateCreateHandler geo (restaurant IPFS fixture)', () => {
  const baseCtx: OdlEventContext = {
    action: 'update_create',
    creator: 'flowmaster',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 11,
    transactionId: 'tx-gps-rest',
    timestamp: new Date().toISOString(),
    eventSeq: BigInt(12),
    eventIdIndexMap: new Map(),
  };

  const restaurantCore = mockObjectsCore({
    object_id: 'gps-flowmaster-rest-1',
    object_type: OBJECT_TYPES.RESTAURANT,
    creator: 'flowmaster',
    weight: null,
    meta_group_id: null,
    canonical: null,
    canonical_creator: null,
    transaction_id: 'tx0',
    status: 'active',
    seq: 0,
  });

  it('persists geo via ST_GeomFromGeoJSON geography binding', async () => {
    const createReplacingIfPresent = jest.fn().mockResolvedValue(undefined);
    const objectUpdatesRepository = {
      createReplacingIfPresent,
      findByObjectTypeAndCreator: jest.fn().mockResolvedValue(undefined),
      existsByObjectAndValue: jest.fn().mockResolvedValue(false),
    } as unknown as import('../../../repositories').ObjectUpdatesRepository;
    const objectsCoreRepository = {
      findByObjectId: jest.fn().mockResolvedValue(restaurantCore),
    } as unknown as import('../../../repositories').ObjectsCoreRepository;
    const handler = new UpdateCreateHandler(
      objectUpdatesRepository,
      objectsCoreRepository,
      defaultUpdateCreateUserRefDeps().accountsCurrentRepository,
      defaultUpdateCreateUserRefDeps().accountSyncQueueRepository,
      defaultUpdateCreateUserRefDeps().hiveClient,
      new WriteGuardRunner([new GovernanceWriteGuard()]),
      { emit: jest.fn() } as unknown as EventEmitter2,
    );

    await handler.handle(
      {
        object_id: 'gps-flowmaster-rest-1',
        update_type: 'geo',
        creator: 'flowmaster',
        value_geo: { latitude: 49.774724, longitude: 35.68634 },
      },
      baseCtx,
    );

    expect(createReplacingIfPresent).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        update_type: 'geo',
        value_geo: {
          type: 'Point',
          coordinates: [35.68634, 49.774724],
        },
      }),
    );

    const inserted = createReplacingIfPresent.mock.calls[0]![1] as {
      value_geo: { type: string; coordinates: number[] };
    };
    const sqlValues = objectUpdateInsertValues(inserted);
    expect(sqlValues.value_geo).toBeDefined();
    expect(sqlValues.value_geo).not.toEqual(inserted.value_geo);
  });
});
