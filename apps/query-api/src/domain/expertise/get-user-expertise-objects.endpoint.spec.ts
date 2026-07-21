import type { ObjectsCore } from '@opden-data-layer/core';
import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AccountsCurrentRepository,
  AggregatedObjectRepository,
  UserObjectExpertiseRepository,
} from '../../repositories';
import type { ProjectedObject } from '../object-projection';
import { ObjectProjectionService } from '../object-projection';
import { emptyRankVoteProjection } from '../object-projection/projected-object.types';
import type { UserExpertiseObjectsQuery } from './expertise.schema';
import { GetUserExpertiseObjectsEndpoint } from './get-user-expertise-objects.endpoint';

describe('GetUserExpertiseObjectsEndpoint', () => {
  const query: UserExpertiseObjectsQuery = { scope: 'objects', skip: 0, limit: 2 };

  it('returns null when account missing', async () => {
    const accounts = { findByName: jest.fn().mockResolvedValue(null) } as unknown as AccountsCurrentRepository;
    const endpoint = new GetUserExpertiseObjectsEndpoint(
      accounts,
      {} as UserObjectExpertiseRepository,
      {} as AggregatedObjectRepository,
      {} as ObjectViewService,
      {} as ObjectProjectionService,
    );
    await expect(endpoint.execute('x', query, 'en-US', undefined, undefined)).resolves.toBeNull();
  });

  it('returns empty page when no expertise rows', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue({ name: 'alice' }),
    } as unknown as AccountsCurrentRepository;
    const expertiseRepo = {
      countByScope: jest.fn().mockResolvedValue(0),
      listByScope: jest.fn().mockResolvedValue([]),
    } as unknown as UserObjectExpertiseRepository;

    const endpoint = new GetUserExpertiseObjectsEndpoint(
      accounts,
      expertiseRepo,
      {} as AggregatedObjectRepository,
      {} as ObjectViewService,
      {} as ObjectProjectionService,
    );

    await expect(endpoint.execute('alice', query, 'en-US', undefined, undefined)).resolves.toEqual({
      items: [],
      total: 0,
      hasMore: false,
    });
  });

  it('uses limit+1 probe for hasMore and attaches user_weight', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue({ name: 'alice' }),
    } as unknown as AccountsCurrentRepository;
    const expertiseRepo = {
      countByScope: jest.fn().mockResolvedValue(5),
      listByScope: jest.fn().mockResolvedValue([
        { object_id: 'o1', weight: 10, object_type: 'restaurant' },
        { object_id: 'o2', weight: 8, object_type: 'restaurant' },
        { object_id: 'o3', weight: 6, object_type: 'restaurant' },
      ]),
    } as unknown as UserObjectExpertiseRepository;

    const mockView: ResolvedObjectView = {
      object_id: 'o1',
      object_type: 'restaurant',
      creator: 'c',
      weight: 5,
      meta_group_id: null,
      status: 'active',
      canonical: null,
      fields: {},
    };

    const core: ObjectsCore = {
      object_id: 'o1',
      object_type: 'restaurant',
      creator: 'c',
      weight: 5,
      meta_group_id: null,
      canonical: null,
      canonical_creator: null,
      transaction_id: 'tx',
      status: 'active',
      seq: 0,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
    };

    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [{ core, updates: [], validity_votes: [], authorities: [] }],
        voterWaivPowers: new Map(),
        rankVoteProjection: emptyRankVoteProjection(),
      }),
    } as unknown as AggregatedObjectRepository;

    const objectViewService = {
      resolve: jest.fn().mockReturnValue([mockView]),
    } as unknown as ObjectViewService;

    const projected: ProjectedObject = {
      object_id: 'o1',
      object_type: 'restaurant',
      semantic_type: null,
      status: 'active',
      weight: 5,
      fields: { name: 'Cafe' },
      hasAdministrativeAuthority: false,
      hasOwnershipAuthority: false,
    };

    const objectProjection = {
      batchProject: jest.fn().mockResolvedValue([projected]),
    } as unknown as ObjectProjectionService;

    const endpoint = new GetUserExpertiseObjectsEndpoint(
      accounts,
      expertiseRepo,
      aggregatedObjectRepo,
      objectViewService,
      objectProjection,
    );

    const result = await endpoint.execute('alice', query, 'en-US', undefined, undefined);

    expect(expertiseRepo.listByScope).toHaveBeenCalledWith('alice', 'objects', 0, 2);
    expect(result).toEqual({
      items: [{ ...projected, user_weight: 10 }],
      total: 5,
      hasMore: true,
    });
    expect(objectProjection.batchProject).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ locale: 'en-US' }),
    );
  });
});
