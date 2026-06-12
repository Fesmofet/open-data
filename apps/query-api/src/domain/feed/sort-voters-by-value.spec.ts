import {
  sliceVotersAfterCursor,
  sortVotersByValueUsd,
  voterValueSortKey,
} from './sort-voters-by-value';

type Row = { voter: string };

describe('sortVotersByValueUsd', () => {
  it('orders by valueUsd desc then voter asc', () => {
    const sorted = sortVotersByValueUsd<Row>([
      { row: { voter: 'bob' }, valueUsd: 1 },
      { row: { voter: 'alice' }, valueUsd: 5 },
      { row: { voter: 'carol' }, valueUsd: 5 },
    ]);
    expect(sorted.map((s) => s.row.voter)).toEqual(['alice', 'carol', 'bob']);
  });
});

describe('sliceVotersAfterCursor', () => {
  it('returns rows after cursor by value and voter tie-break', () => {
    const rows = sortVotersByValueUsd<Row>([
      { row: { voter: 'waivio.com' }, valueUsd: 0.64 },
      { row: { voter: 'alice' }, valueUsd: 0 },
      { row: { voter: 'bob' }, valueUsd: 0 },
    ]);
    const slice = sliceVotersAfterCursor(rows, {
      sortKey: voterValueSortKey(0.64),
      voter: 'waivio.com',
    });
    expect(slice.map((s) => s.row.voter)).toEqual(['alice', 'bob']);
  });
});
