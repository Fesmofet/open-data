import { UPDATE_TYPES } from '@opden-data-layer/core';
import {
  ObjectsCore,
  ObjectUpdate,
  ValidityVote,
} from '@opden-data-layer/odl-db-types';

import { ObjectViewService } from '../services/object-view.service';
import type { AggregatedObject } from '../types/aggregated-object';
import { DEFAULT_GOVERNANCE_SNAPSHOT } from '../types/governance-snapshot';
import { materializeObjectCoreStatus } from './materialize-object-core-status';

function makeCore(objectId: string): ObjectsCore {
  return {
    object_id: objectId,
    object_type: 'place',
    creator: 'alice',
    weight: null,
    meta_group_id: null,
    canonical: null,
    canonical_creator: null,
    transaction_id: 'tx1',
    status: 'active',
    seq: 1,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
  };
}

function makeStatusUpdate(
  updateId: string,
  objectId: string,
  title: string,
  creator = 'bob',
  eventSeq = BigInt(10),
): ObjectUpdate {
  return {
    update_id: updateId,
    object_id: objectId,
    update_type: UPDATE_TYPES.STATUS,
    creator,
    locale: null,
    created_at_unix: 1000,
    event_seq: eventSeq,
    transaction_id: 'tx1',
    value_text: null,
    value_geo: null,
    value_json: { title },
    value_text_normalized: null,
    search_vector: null,
    rank_score: null,
    rank_context: null,
    rank_decisive_event_seq: null,
  };
}

function makeAggregated(
  objectId: string,
  updates: ObjectUpdate[],
  validityVotes: ValidityVote[] = [],
): AggregatedObject {
  return {
    core: makeCore(objectId),
    updates,
    validity_votes: validityVotes,
    favorites: [],
    ownerships: [],
  };
}

describe('materializeObjectCoreStatus', () => {
  const objectViewService = new ObjectViewService();
  const governance = DEFAULT_GOVERNANCE_SNAPSHOT;

  it('returns active when winning status title is protected', () => {
    const objectId = 'o1';
    const update = makeStatusUpdate('u1', objectId, 'protected');
    const aggregated = makeAggregated(objectId, [update], [
      {
        update_id: 'u1',
        object_id: objectId,
        voter: 'bob',
        vote: 'for',
        event_seq: BigInt(1),
        transaction_id: 'tx1',
      },
    ]);

    expect(
      materializeObjectCoreStatus(aggregated, new Map(), governance, objectViewService),
    ).toBe('active');
  });

  it('returns active when no VALID status winner', () => {
    const objectId = 'o2';
    const update = makeStatusUpdate('u2', objectId, 'unavailable');
    const aggregated = makeAggregated(objectId, [update], [
      {
        update_id: 'u2',
        object_id: objectId,
        voter: 'carol',
        vote: 'against',
        event_seq: BigInt(1),
        transaction_id: 'tx1',
      },
    ]);

    expect(
      materializeObjectCoreStatus(aggregated, new Map(), governance, objectViewService),
    ).toBe('active');
  });

  it('returns unavailable when that status wins votes', () => {
    const objectId = 'o3';
    const update = makeStatusUpdate('u3', objectId, 'unavailable');
    const aggregated = makeAggregated(objectId, [update], [
      {
        update_id: 'u3',
        object_id: objectId,
        voter: 'bob',
        vote: 'for',
        event_seq: BigInt(1),
        transaction_id: 'tx1',
      },
    ]);

    expect(
      materializeObjectCoreStatus(aggregated, new Map(), governance, objectViewService),
    ).toBe('unavailable');
  });

  it('returns active when winning payload fails schema parse', () => {
    const objectId = 'o4';
    const update = makeStatusUpdate('u4', objectId, 'unavailable');
    update.value_json = { title: 'not-a-status' };
    const aggregated = makeAggregated(objectId, [update], [
      {
        update_id: 'u4',
        object_id: objectId,
        voter: 'bob',
        vote: 'for',
        event_seq: BigInt(1),
        transaction_id: 'tx1',
      },
    ]);

    expect(
      materializeObjectCoreStatus(aggregated, new Map(), governance, objectViewService),
    ).toBe('active');
  });
});
