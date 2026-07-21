import { DEFAULT_GOVERNANCE_SNAPSHOT } from '@opden-data-layer/objects-domain';
import type { AggregatedObjectRepository } from '../../repositories';
import type { ObjectsCoreRepository } from '../../repositories/objects-core.repository';
import { GovernanceResolverService } from '../governance';
import { ObjectProjectionService } from '../object-projection/object-projection.service';
import {
  GetObjectOptionsEndpoint,
  OPTIONS_SIBLING_CAP,
  objectTypeSupportsOptions,
} from './get-object-options.endpoint';

describe('objectTypeSupportsOptions', () => {
  it('returns true for product', () => {
    expect(objectTypeSupportsOptions('product')).toBe(true);
  });

  it('returns false for list', () => {
    expect(objectTypeSupportsOptions('list')).toBe(false);
  });
});

describe('GetObjectOptionsEndpoint', () => {
  const governanceResolver = {
    resolveMergedForObjectView: jest.fn().mockResolvedValue(DEFAULT_GOVERNANCE_SNAPSHOT),
  } as unknown as GovernanceResolverService;

  it('returns null when object does not exist', async () => {
    const objectsCore = {
      findByObjectIdForPage: jest.fn().mockResolvedValue(null),
    } as unknown as ObjectsCoreRepository;

    const endpoint = new GetObjectOptionsEndpoint(
      objectsCore,
      {} as AggregatedObjectRepository,
      {} as never,
      governanceResolver,
      {} as ObjectProjectionService,
    );

    await expect(endpoint.execute('missing', 'en-US')).resolves.toBeNull();
  });

  it('returns empty options when object type does not support option', async () => {
    const objectsCore = {
      findByObjectIdForPage: jest.fn().mockResolvedValue({
        object_id: 'list-1',
        object_type: 'list',
        meta_group_id: null,
      }),
    } as unknown as ObjectsCoreRepository;

    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn(),
    } as unknown as AggregatedObjectRepository;

    const endpoint = new GetObjectOptionsEndpoint(
      objectsCore,
      aggregatedObjectRepo,
      {} as never,
      governanceResolver,
      {} as ObjectProjectionService,
    );

    await expect(endpoint.execute('list-1', 'en-US')).resolves.toEqual({
      object_id: 'list-1',
      options: {},
    });
    expect(aggregatedObjectRepo.loadByObjectIds).not.toHaveBeenCalled();
  });

  it('aggregates options from meta_group siblings', async () => {
    const objectsCore = {
      findByObjectIdForPage: jest.fn().mockResolvedValue({
        object_id: 'prod-a',
        object_type: 'product',
        meta_group_id: 'grp-1',
      }),
      findObjectIdsByMetaGroupId: jest.fn().mockResolvedValue(['prod-b']),
    } as unknown as ObjectsCoreRepository;

    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [{ core: { object_id: 'prod-a' } }, { core: { object_id: 'prod-b' } }],
        voterWaivPowers: new Map(),
      }),
    } as unknown as AggregatedObjectRepository;

    const objectViewService = {
      resolve: jest.fn().mockReturnValue([
        { object_id: 'prod-a', fields: {} },
        { object_id: 'prod-b', fields: {} },
      ]),
    };

    const objectProjectionService = {
      batchProject: jest.fn().mockResolvedValue([
        {
          object_id: 'prod-a',
          fields: {
            option: [{ category: 'Color', value: 'Red', position: 1 }],
            price: '10',
            image: 'https://x/a.png',
          },
        },
        {
          object_id: 'prod-b',
          fields: {
            option: [{ category: 'Size', value: 'L', position: 1 }],
            price: '12',
            image: 'https://x/b.png',
          },
        },
      ]),
    } as unknown as ObjectProjectionService;

    const endpoint = new GetObjectOptionsEndpoint(
      objectsCore,
      aggregatedObjectRepo,
      objectViewService as never,
      governanceResolver,
      objectProjectionService,
    );

    const result = await endpoint.execute('prod-a', 'en-US');
    expect(objectsCore.findObjectIdsByMetaGroupId).toHaveBeenCalledWith(
      'grp-1',
      'prod-a',
      OPTIONS_SIBLING_CAP - 1,
    );
    expect(aggregatedObjectRepo.loadByObjectIds).toHaveBeenCalledWith(['prod-a', 'prod-b'], {
      viewerAccount: undefined,
      includeRankVoteProjection: false,
    });
    expect(result).toEqual({
      object_id: 'prod-a',
      options: {
        Color: [
          {
            object_id: 'prod-a',
            category: 'Color',
            value: 'Red',
            position: 1,
            image: null,
            price: '10',
            imageUrl: 'https://x/a.png',
          },
        ],
        Size: [
          {
            object_id: 'prod-b',
            category: 'Size',
            value: 'L',
            position: 1,
            image: null,
            price: '12',
            imageUrl: 'https://x/b.png',
          },
        ],
      },
    });
  });

  it('preserves sibling order for duplicate-value dedupe (first wins)', async () => {
    const objectsCore = {
      findByObjectIdForPage: jest.fn().mockResolvedValue({
        object_id: 'prod-a',
        object_type: 'product',
        meta_group_id: 'grp-1',
      }),
      findObjectIdsByMetaGroupId: jest.fn().mockResolvedValue(['prod-b', 'prod-c']),
    } as unknown as ObjectsCoreRepository;

    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [
          { core: { object_id: 'prod-a' } },
          { core: { object_id: 'prod-b' } },
          { core: { object_id: 'prod-c' } },
        ],
        voterWaivPowers: new Map(),
      }),
    } as unknown as AggregatedObjectRepository;

    const objectViewService = {
      resolve: jest.fn().mockReturnValue([
        { object_id: 'prod-a', fields: {} },
        { object_id: 'prod-b', fields: {} },
        { object_id: 'prod-c', fields: {} },
      ]),
    };

    const objectProjectionService = {
      batchProject: jest.fn().mockResolvedValue([
        {
          object_id: 'prod-b',
          fields: {
            option: [{ category: 'Color', value: 'Red', position: 1 }],
          },
        },
        {
          object_id: 'prod-a',
          fields: {
            option: [{ category: 'Color', value: 'Red', position: 1 }],
          },
        },
        {
          object_id: 'prod-c',
          fields: {
            option: [{ category: 'Color', value: 'Red', position: 1 }],
          },
        },
      ]),
    } as unknown as ObjectProjectionService;

    const endpoint = new GetObjectOptionsEndpoint(
      objectsCore,
      aggregatedObjectRepo,
      objectViewService as never,
      governanceResolver,
      objectProjectionService,
    );

    const result = await endpoint.execute('prod-a', 'en-US');
    expect(result?.options.Color).toEqual([
      expect.objectContaining({ object_id: 'prod-a', value: 'Red' }),
    ]);
  });

  it('caps sibling load at OPTIONS_SIBLING_CAP', async () => {
    const objectsCore = {
      findByObjectIdForPage: jest.fn().mockResolvedValue({
        object_id: 'prod-a',
        object_type: 'product',
        meta_group_id: 'grp-1',
      }),
      findObjectIdsByMetaGroupId: jest.fn().mockResolvedValue(
        Array.from({ length: OPTIONS_SIBLING_CAP - 1 }, (_, i) => `prod-${i}`),
      ),
    } as unknown as ObjectsCoreRepository;

    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [],
        voterWaivPowers: new Map(),
      }),
    } as unknown as AggregatedObjectRepository;

    const endpoint = new GetObjectOptionsEndpoint(
      objectsCore,
      aggregatedObjectRepo,
      { resolve: jest.fn().mockReturnValue([]) } as never,
      governanceResolver,
      { batchProject: jest.fn().mockResolvedValue([]) } as unknown as ObjectProjectionService,
    );

    await endpoint.execute('prod-a', 'en-US');
    expect(objectsCore.findObjectIdsByMetaGroupId).toHaveBeenCalledWith(
      'grp-1',
      'prod-a',
      OPTIONS_SIBLING_CAP - 1,
    );
    expect(aggregatedObjectRepo.loadByObjectIds).toHaveBeenCalledWith(
      ['prod-a', ...Array.from({ length: OPTIONS_SIBLING_CAP - 1 }, (_, i) => `prod-${i}`)],
      expect.objectContaining({ includeRankVoteProjection: false }),
    );
  });
});
