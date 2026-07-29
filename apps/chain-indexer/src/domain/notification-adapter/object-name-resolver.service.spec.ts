import type { RedisClientFactory } from '@opden-data-layer/clients';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import type { ObjectViewService } from '@opden-data-layer/objects-domain';
import { DEFAULT_GOVERNANCE_SNAPSHOT } from '@opden-data-layer/objects-domain';
import { OBJECT_NAME_CACHE_TTL_SECONDS } from '../../constants/object-name-cache.constants';
import type { AggregatedObjectRepository } from '../../repositories';
import type { GovernanceCacheService } from '../governance/governance-cache.service';
import { ObjectNameResolverService } from './object-name-resolver.service';

describe('ObjectNameResolverService', () => {
  const objectId = 'rcl-borkor';
  const aggregated = { core: { object_id: objectId } } as never;

  function makeService(deps: {
    get?: jest.Mock;
    set?: jest.Mock;
    loadByObjectIds?: jest.Mock;
    governanceResolve?: jest.Mock;
    viewResolve?: jest.Mock;
  }) {
    const get = deps.get ?? jest.fn().mockResolvedValue(null);
    const set = deps.set ?? jest.fn().mockResolvedValue(undefined);
    const redisFactory = {
      getClient: () => ({ get, set, del: jest.fn() }),
    } as unknown as RedisClientFactory;

    const aggregatedObjectRepository = {
      loadByObjectIds: deps.loadByObjectIds ?? jest.fn().mockResolvedValue({ objects: [], voterWaivPowers: new Map() }),
    } as unknown as AggregatedObjectRepository;

    const governanceCacheService = {
      resolve: deps.governanceResolve ?? jest.fn().mockResolvedValue(DEFAULT_GOVERNANCE_SNAPSHOT),
    } as unknown as GovernanceCacheService;

    const objectViewService = {
      resolve: deps.viewResolve ?? jest.fn().mockReturnValue([]),
    } as unknown as ObjectViewService;

    const service = new ObjectNameResolverService(
      aggregatedObjectRepository,
      objectViewService,
      governanceCacheService,
      redisFactory,
    );

    return {
      service,
      get,
      set,
      loadByObjectIds: aggregatedObjectRepository.loadByObjectIds as jest.Mock,
      viewResolve: objectViewService.resolve as jest.Mock,
    };
  }

  it('returns cached name on cache hit', async () => {
    const { service, get, loadByObjectIds } = makeService({
      get: jest.fn().mockResolvedValue('Borkor Restaurant'),
    });

    const name = await service.resolve(objectId);

    expect(name).toBe('Borkor Restaurant');
    expect(get).toHaveBeenCalled();
    expect(loadByObjectIds).not.toHaveBeenCalled();
  });

  it('returns null on negative cache without hitting DB', async () => {
    const { service, loadByObjectIds } = makeService({
      get: jest.fn().mockResolvedValue(''),
    });

    const name = await service.resolve(objectId);

    expect(name).toBeNull();
    expect(loadByObjectIds).not.toHaveBeenCalled();
  });

  it('resolves from DB on miss and writes cache with TTL', async () => {
    const set = jest.fn().mockResolvedValue(undefined);
    const viewResolve = jest.fn().mockReturnValue([
      {
        fields: {
          [UPDATE_TYPES.NAME]: {
            values: [{ validity_status: 'VALID', value_text: '  Borkor  ' }],
          },
        },
      },
    ]);
    const { service, set: setMock, loadByObjectIds } = makeService({
      set,
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [aggregated],
        voterWaivPowers: new Map(),
      }),
      viewResolve,
    });

    const name = await service.resolve(objectId);

    expect(name).toBe('Borkor');
    expect(loadByObjectIds).toHaveBeenCalledWith([objectId]);
    expect(setMock).toHaveBeenCalledWith(
      expect.stringContaining('object-name'),
      'Borkor',
      OBJECT_NAME_CACHE_TTL_SECONDS,
    );
  });

  it('returns null when winning name update is REJECTED', async () => {
    const viewResolve = jest.fn().mockReturnValue([
      {
        fields: {
          [UPDATE_TYPES.NAME]: {
            values: [{ validity_status: 'REJECTED', value_text: 'X' }],
          },
        },
      },
    ]);
    const { service } = makeService({
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [aggregated],
        voterWaivPowers: new Map(),
      }),
      viewResolve,
    });

    expect(await service.resolve(objectId)).toBeNull();
  });

  it('returns null when object is missing', async () => {
    const { service } = makeService({
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [],
        voterWaivPowers: new Map(),
      }),
    });

    expect(await service.resolve(objectId)).toBeNull();
  });

  it('returns null on Redis error without throwing', async () => {
    const { service } = makeService({
      get: jest.fn().mockRejectedValue(new Error('redis down')),
    });

    await expect(service.resolve(objectId)).resolves.toBeNull();
  });
});
