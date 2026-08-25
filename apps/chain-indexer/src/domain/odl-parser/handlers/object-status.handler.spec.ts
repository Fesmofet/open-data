jest.mock('@opden-data-layer/objects-domain', () => {
  const actual = jest.requireActual('@opden-data-layer/objects-domain') as typeof import('@opden-data-layer/objects-domain');
  return {
    ...actual,
    materializeObjectCoreStatus: jest.fn(),
  };
});

import {
  materializeObjectCoreStatus,
  ObjectViewService,
} from '@opden-data-layer/objects-domain';

import { ObjectStatusHandler } from './object-status.handler';
import { ObjectStatusRecomputeEvent } from '../object-status-created.event';

const materializeMock = materializeObjectCoreStatus as jest.MockedFunction<
  typeof materializeObjectCoreStatus
>;

describe('ObjectStatusHandler', () => {
  const aggregated = {
    core: {
      object_id: 'o1',
      object_type: 'place',
      creator: 'alice',
      weight: null,
      meta_group_id: null,
      canonical: null,
      canonical_creator: null,
      transaction_id: 'tx0',
      status: 'active' as const,
      seq: 0,
      created_at: new Date(),
    },
    updates: [],
    validity_votes: [],
    favorites: [],
    ownerships: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates objects_core when materialized status differs', async () => {
    materializeMock.mockReturnValue('unavailable');
    const governanceCacheService = {
      resolvePlatform: jest.fn().mockResolvedValue({ admins: [] }),
    };
    const aggregatedObjectRepository = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [aggregated],
        voterWaivPowers: new Map(),
      }),
    };
    const update = jest.fn().mockResolvedValue(undefined);
    const enqueue = jest.fn().mockResolvedValue(undefined);
    const handler = new ObjectStatusHandler(
      governanceCacheService as never,
      aggregatedObjectRepository as never,
      new ObjectViewService(),
      { update } as never,
      { enqueue } as never,
    );

    await handler.handleObjectStatusRecompute(new ObjectStatusRecomputeEvent('o1'));

    expect(governanceCacheService.resolvePlatform).toHaveBeenCalledTimes(1);
    expect(materializeMock).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('o1', { status: 'unavailable' });
    expect(enqueue).toHaveBeenCalledWith('o1', expect.any(Number));
  });

  it('sets core to active when protected wins materialization', async () => {
    materializeMock.mockReturnValue('active');
    const aggregatedUnavailable = {
      ...aggregated,
      core: { ...aggregated.core, status: 'unavailable' as const },
    };
    const update = jest.fn().mockResolvedValue(undefined);
    const enqueue = jest.fn().mockResolvedValue(undefined);
    const handler = new ObjectStatusHandler(
      { resolvePlatform: jest.fn().mockResolvedValue({}) } as never,
      {
        loadByObjectIds: jest.fn().mockResolvedValue({
          objects: [aggregatedUnavailable],
          voterWaivPowers: new Map(),
        }),
      } as never,
      new ObjectViewService(),
      { update } as never,
      { enqueue } as never,
    );

    await handler.handleObjectStatusRecompute(new ObjectStatusRecomputeEvent('o1'));

    expect(update).toHaveBeenCalledWith('o1', { status: 'active' });
    expect(enqueue).toHaveBeenCalledWith('o1', expect.any(Number));
  });

  it('skips update when materialized status unchanged', async () => {
    materializeMock.mockReturnValue('active');
    const update = jest.fn();
    const handler = new ObjectStatusHandler(
      { resolvePlatform: jest.fn().mockResolvedValue({}) } as never,
      {
        loadByObjectIds: jest.fn().mockResolvedValue({
          objects: [aggregated],
          voterWaivPowers: new Map(),
        }),
      } as never,
      new ObjectViewService(),
      { update } as never,
      { enqueue: jest.fn() } as never,
    );

    await handler.handleObjectStatusRecompute(new ObjectStatusRecomputeEvent('o1'));

    expect(update).not.toHaveBeenCalled();
  });

  it('materializes for non-admin winning updates without admin gate', async () => {
    materializeMock.mockReturnValue('unavailable');
    const update = jest.fn().mockResolvedValue(undefined);
    const handler = new ObjectStatusHandler(
      { resolvePlatform: jest.fn().mockResolvedValue({ admins: ['admin1'] }) } as never,
      {
        loadByObjectIds: jest.fn().mockResolvedValue({
          objects: [aggregated],
          voterWaivPowers: new Map(),
        }),
      } as never,
      new ObjectViewService(),
      { update } as never,
      { enqueue: jest.fn().mockResolvedValue(undefined) } as never,
    );

    await handler.handleObjectStatusRecompute(new ObjectStatusRecomputeEvent('o1'));

    expect(update).toHaveBeenCalledWith('o1', { status: 'unavailable' });
  });
});
