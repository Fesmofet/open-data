import { UPDATE_TYPES } from '@opden-data-layer/core';
import type { GovernanceSnapshot, ResolvedObjectView, ResolvedUpdate } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';

import { AggregatedObjectRepository } from '../../repositories';
import type { ListItemsRecursiveCountService } from './list-items-recursive-count.service';
import { expandObjectRefs } from './object-ref-expansion';
import { emptyRankVoteProjection } from './projected-object.types';

function resolvedUpdate(overrides: Partial<ResolvedUpdate> = {}): ResolvedUpdate {
  return {
    update_id: 'upd-1',
    update_type: UPDATE_TYPES.NAME,
    creator: 'alice',
    locale: null,
    created_at_unix: 0,
    event_seq: BigInt(0),
    value_text: null,
    value_geo: null,
    value_json: null,
    validity_status: 'VALID',
    validity_tier: 'baseline',
    decisive_vote_event_seq: null,
    approve_percent: 100,
    field_weight: null,
    rank_score: null,
    rank_context: null,
    rank_decisive_event_seq: null,
    ...overrides,
  };
}

function productView(overrides: Partial<ResolvedObjectView> = {}): ResolvedObjectView {
  return {
    object_id: 'product-1',
    object_type: 'product',
    creator: 'alice',
    weight: 1,
    meta_group_id: null,
    status: 'active',
    canonical: null,
    fields: {},
    ...overrides,
  };
}

function parentView(): ResolvedObjectView {
  return {
    object_id: 'shop-parent',
    object_type: 'shop',
    creator: 'alice',
    weight: 2,
    meta_group_id: null,
    status: 'active',
    canonical: null,
    fields: {
      [UPDATE_TYPES.NAME]: {
        update_type: UPDATE_TYPES.NAME,
        cardinality: 'single',
        values: [resolvedUpdate({ update_type: UPDATE_TYPES.NAME, value_text: 'Miss Bitcoin Shop' })],
      },
      [UPDATE_TYPES.IMAGE]: {
        update_type: UPDATE_TYPES.IMAGE,
        cardinality: 'single',
        values: [
          resolvedUpdate({
            update_type: UPDATE_TYPES.IMAGE,
            value_text: 'https://example.com/parent.jpg',
          }),
        ],
      },
    },
  };
}

function brandView(): ResolvedObjectView {
  return {
    object_id: 'brand-1',
    object_type: 'business',
    creator: 'alice',
    weight: 1,
    meta_group_id: null,
    status: 'active',
    canonical: null,
    fields: {
      [UPDATE_TYPES.NAME]: {
        update_type: UPDATE_TYPES.NAME,
        cardinality: 'single',
        values: [resolvedUpdate({ update_type: UPDATE_TYPES.NAME, value_text: 'Itzayana' })],
      },
    },
  };
}

function makeDeps(loadByObjectIds: jest.Mock) {
  const objectViewService = {
    resolve: jest.fn((objects: { core: { object_id: string } }[]) =>
      objects.map((o) => {
        if (o.core.object_id === 'product-1') {
          return productView({
            fields: {
              [UPDATE_TYPES.NAME]: {
                update_type: UPDATE_TYPES.NAME,
                cardinality: 'single',
                values: [
                  resolvedUpdate({
                    update_type: UPDATE_TYPES.NAME,
                    value_text: 'Macadamia Tincture',
                  }),
                ],
              },
              [UPDATE_TYPES.PRICE]: {
                update_type: UPDATE_TYPES.PRICE,
                cardinality: 'single',
                values: [
                  resolvedUpdate({
                    update_type: UPDATE_TYPES.PRICE,
                    value_text: 'MX$225.00',
                  }),
                ],
              },
              [UPDATE_TYPES.PARENT]: {
                update_type: UPDATE_TYPES.PARENT,
                cardinality: 'single',
                values: [
                  resolvedUpdate({
                    update_type: UPDATE_TYPES.PARENT,
                    value_text: 'shop-parent',
                  }),
                ],
              },
              [UPDATE_TYPES.BRAND]: {
                update_type: UPDATE_TYPES.BRAND,
                cardinality: 'single',
                values: [
                  resolvedUpdate({
                    update_type: UPDATE_TYPES.BRAND,
                    value_text: 'brand-1',
                  }),
                ],
              },
            },
          });
        }
        if (o.core.object_id === 'shop-parent') {
          return parentView();
        }
        if (o.core.object_id === 'brand-1') {
          return brandView();
        }
        if (o.core.object_id === 'product-no-image') {
          return productView({
            object_id: 'product-no-image',
            fields: {
              [UPDATE_TYPES.NAME]: {
                update_type: UPDATE_TYPES.NAME,
                cardinality: 'single',
                values: [
                  resolvedUpdate({
                    update_type: UPDATE_TYPES.NAME,
                    value_text: 'No Image Product',
                  }),
                ],
              },
              [UPDATE_TYPES.PARENT]: {
                update_type: UPDATE_TYPES.PARENT,
                cardinality: 'single',
                values: [
                  resolvedUpdate({
                    update_type: UPDATE_TYPES.PARENT,
                    value_text: 'shop-parent',
                  }),
                ],
              },
            },
          });
        }
        return productView({ object_id: o.core.object_id });
      }),
    ),
  } as unknown as ObjectViewService;

  return {
    aggregatedObjectRepo: { loadByObjectIds } as unknown as AggregatedObjectRepository,
    objectViewService,
    listItemsRecursiveCountService: {
      countForListRefIds: jest.fn().mockResolvedValue(new Map()),
    } as unknown as ListItemsRecursiveCountService,
    parentObjectId: 'list-parent',
    governance: { platform: {}, merged: {} } as unknown as GovernanceSnapshot,
    locale: 'en-US',
    contentBaseUrl: 'https://ipfs.example',
    viewerAccount: undefined,
    viewerAdminIds: undefined,
  };
}

describe('expandObjectRefs', () => {
  it('projects price, parent, and brand on ref summaries', async () => {
    const loadByObjectIds = jest
      .fn()
      .mockResolvedValueOnce({
        objects: [{ core: { object_id: 'product-1', object_type: 'product', weight: 1 } }],
        voterWaivPowers: {},
        rankVoteProjection: emptyRankVoteProjection(),
      })
      .mockResolvedValueOnce({
        objects: [
          { core: { object_id: 'shop-parent', object_type: 'shop', weight: 2 } },
          { core: { object_id: 'brand-1', object_type: 'business', weight: 1 } },
        ],
        voterWaivPowers: {},
        rankVoteProjection: emptyRankVoteProjection(),
      });

    const result = await expandObjectRefs(['product-1'], makeDeps(loadByObjectIds));

    const summary = result.get('product-1');
    expect(summary?.fields.price).toBe('MX$225.00');
    expect(summary?.fields.parent).toEqual({
      object_id: 'shop-parent',
      object_type: 'shop',
      fields: {
        name: 'Miss Bitcoin Shop',
        image: 'https://example.com/parent.jpg',
      },
      weight: 2,
    });
    expect(summary?.fields.brand).toEqual({
      object_id: 'brand-1',
      object_type: 'business',
      fields: { name: 'Itzayana' },
      weight: 1,
    });
  });

  it('fills ref image from parent when product has no image', async () => {
    const loadByObjectIds = jest
      .fn()
      .mockResolvedValueOnce({
        objects: [{ core: { object_id: 'product-no-image', object_type: 'product', weight: 1 } }],
        voterWaivPowers: {},
        rankVoteProjection: emptyRankVoteProjection(),
      })
      .mockResolvedValueOnce({
        objects: [{ core: { object_id: 'shop-parent', object_type: 'shop', weight: 2 } }],
        voterWaivPowers: {},
        rankVoteProjection: emptyRankVoteProjection(),
      });

    const result = await expandObjectRefs(['product-no-image'], makeDeps(loadByObjectIds));

    expect(result.get('product-no-image')?.fields.image).toBe('https://example.com/parent.jpg');
    expect(result.get('product-no-image')?.fields.parent).toMatchObject({
      object_id: 'shop-parent',
      fields: { name: 'Miss Bitcoin Shop' },
    });
  });

  it('returns empty map for empty ref id list', async () => {
    const loadByObjectIds = jest.fn();
    const result = await expandObjectRefs([], makeDeps(loadByObjectIds));
    expect(result.size).toBe(0);
    expect(loadByObjectIds).not.toHaveBeenCalled();
  });
});
