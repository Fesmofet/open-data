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

  it('sets virtual reward bits above JS 32-bit shift range', () => {
    expect(makeOperationBitMask([HIVE_OPERATION_INDEX.author_reward])).toEqual({
      filterLow: 2 ** 51,
      filterHigh: 0,
    });
    expect(makeOperationBitMask([HIVE_OPERATION_INDEX.curation_reward])).toEqual({
      filterLow: 2 ** 52,
      filterHigh: 0,
    });
  });

  it('unions savings and reward indices without JS shift corruption', () => {
    const mask = makeOperationBitMask([
      HIVE_OPERATION_INDEX.transfer_to_savings,
      HIVE_OPERATION_INDEX.transfer_from_savings,
      HIVE_OPERATION_INDEX.fill_transfer_from_savings,
    ]);
    expect(mask.filterLow).toBe(
      (
        BigInt(1) << BigInt(32) |
        BigInt(1) << BigInt(33) |
        BigInt(1) << BigInt(59)
      ).toString(),
    );
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

  it('builds mask for reward filters', () => {
    expect(buildActivityFilterMask(['author_reward'])).toEqual({
      filterLow: 2 ** 51,
      filterHigh: 0,
    });
    expect(buildActivityFilterMask(['curation_reward'])).toEqual({
      filterLow: 2 ** 52,
      filterHigh: 0,
    });
    expect(buildActivityFilterMask(['claim_rewards'])).toEqual({
      filterLow: 2 ** 39,
      filterHigh: 0,
    });
  });

  it('builds savings mask without interest RPC bit', () => {
    const mask = buildActivityFilterMask(['savings']);
    expect(mask?.filterLow).toBe(
      (
        BigInt(1) << BigInt(32) |
        BigInt(1) << BigInt(33) |
        BigInt(1) << BigInt(34) |
        BigInt(1) << BigInt(59)
      ).toString(),
    );
  });

  it('unions mask indices for mixed filters', () => {
    const mask = buildActivityFilterMask(['transfer', 'curation_reward']);
    expect(mask?.filterLow).toBe((1 << 2) + 2 ** 52);
    expect(mask?.filterHigh).toBe(0);
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
