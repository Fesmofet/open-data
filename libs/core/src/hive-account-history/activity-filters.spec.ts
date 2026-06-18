import { makeOperationBitMask } from './make-operation-bit-mask';
import { HIVE_OPERATION_INDEX } from './operation-indices';
import {
  buildActivityFilterMask,
} from './build-activity-filter-mask';
import {
  matchesActivityFilter,
  matchesActivityFilters,
} from './matches-activity-filters';
import { HIVE_OP } from './operation-types';

describe('makeOperationBitMask', () => {
  it('sets vote bit in filterLow', () => {
    expect(makeOperationBitMask([HIVE_OPERATION_INDEX.vote])).toEqual({
      filterLow: 1,
      filterHigh: 0,
    });
  });

  it('sets custom_json bit in filterLow', () => {
    expect(makeOperationBitMask([HIVE_OPERATION_INDEX.custom_json])).toEqual({
      filterLow: 262144,
      filterHigh: 0,
    });
  });

  it('unions multiple indices', () => {
    const mask = makeOperationBitMask([
      HIVE_OPERATION_INDEX.vote,
      HIVE_OPERATION_INDEX.transfer,
    ]);
    expect(mask.filterLow).toBe(1 | (1 << 2));
    expect(mask.filterHigh).toBe(0);
  });
});

describe('buildActivityFilterMask', () => {
  it('returns null for empty filters', () => {
    expect(buildActivityFilterMask([])).toBeNull();
  });

  it('builds mask for finance filters', () => {
    const mask = buildActivityFilterMask(['received', 'transfer']);
    expect(mask).not.toBeNull();
    expect(mask?.filterLow).toBe(1 << HIVE_OPERATION_INDEX.transfer);
  });

  it('skips RPC mask for savings and reward filters', () => {
    expect(buildActivityFilterMask(['savings'])).toBeNull();
    expect(buildActivityFilterMask(['author_reward'])).toBeNull();
    expect(buildActivityFilterMask(['curation_reward'])).toBeNull();
    expect(buildActivityFilterMask(['claim_rewards'])).toBeNull();
  });

  it('skips RPC mask when mixed with high-index ops', () => {
    expect(buildActivityFilterMask(['transfer', 'curation_reward'])).toBeNull();
  });
});

describe('matchesActivityFilters', () => {
  const profile = 'alice';

  it('matches upvoted vote by weight', () => {
    expect(
      matchesActivityFilter(
        { type: HIVE_OP.VOTE, payload: { weight: 10000 } },
        'upvoted',
        profile,
      ),
    ).toBe(true);
    expect(
      matchesActivityFilter(
        { type: HIVE_OP.VOTE, payload: { weight: -5000 } },
        'upvoted',
        profile,
      ),
    ).toBe(false);
  });

  it('matches transfer direction', () => {
    expect(
      matchesActivityFilter(
        {
          type: HIVE_OP.TRANSFER,
          payload: { from: 'bob', to: 'alice', amount: '1.000 HIVE' },
        },
        'received',
        profile,
      ),
    ).toBe(true);
    expect(
      matchesActivityFilter(
        {
          type: HIVE_OP.TRANSFER,
          payload: { from: 'alice', to: 'bob', amount: '1.000 HIVE' },
        },
        'transfer',
        profile,
      ),
    ).toBe(true);
  });

  it('ORs across selected filters', () => {
    expect(
      matchesActivityFilters(
        { type: HIVE_OP.AUTHOR_REWARD, payload: {} },
        ['upvoted', 'author_reward'],
        profile,
      ),
    ).toBe(true);
  });
});
