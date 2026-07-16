import { sortByCreatedAtDesc } from './ledger-sort';

describe('sortByCreatedAtDesc', () => {
  it('orders newest created_at first', () => {
    const rows = [
      { id: 'old', created_at: '2026-01-01T10:00:00.000Z' },
      { id: 'new', created_at: '2026-01-02T10:00:00.000Z' },
      { id: 'mid', created_at: '2026-01-01T20:00:00.000Z' },
    ];

    expect(sortByCreatedAtDesc(rows).map((row) => row.id)).toEqual(['new', 'mid', 'old']);
  });

  it('does not mutate the input array', () => {
    const rows = [
      { id: 'a', created_at: '2026-01-01T10:00:00.000Z' },
      { id: 'b', created_at: '2026-01-02T10:00:00.000Z' },
    ];
    const copy = [...rows];

    sortByCreatedAtDesc(rows);

    expect(rows).toEqual(copy);
  });
});
