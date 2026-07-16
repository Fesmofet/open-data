import {
  buildCursorPage,
  buildOffsetPage,
  decodeOblCursor,
  encodeOblCursor,
} from './obl-pagination';

describe('obl-pagination', () => {
  it('buildOffsetPage trims to limit and sets hasMore', () => {
    expect(buildOffsetPage([1, 2, 3], 2)).toEqual({
      items: [1, 2],
      hasMore: true,
    });
    expect(buildOffsetPage([1], 2)).toEqual({
      items: [1],
      hasMore: false,
    });
  });

  it('encodes and decodes cursor', () => {
    const encoded = encodeOblCursor(BigInt(42), 'pay-1');
    expect(decodeOblCursor(encoded)).toEqual({ seq: BigInt(42), id: 'pay-1' });
    expect(decodeOblCursor('')).toBeNull();
    expect(decodeOblCursor('bad')).toBeNull();
  });

  it('buildCursorPage returns nextCursor when hasMore', () => {
    const rows = [
      { created_event_seq: BigInt(10), id: 'a' },
      { created_event_seq: BigInt(9), id: 'b' },
      { created_event_seq: BigInt(8), id: 'c' },
    ];
    expect(buildCursorPage(rows, 2)).toEqual({
      items: rows.slice(0, 2),
      hasMore: true,
      nextCursor: encodeOblCursor(BigInt(9), 'b'),
    });
  });
});
