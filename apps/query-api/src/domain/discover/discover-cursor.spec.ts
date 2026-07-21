import {
  decodeDiscoverObjectCursor,
  encodeDiscoverObjectCursor,
} from './discover-cursor';

describe('discover object cursor', () => {
  it('round-trips encode/decode', () => {
    const encoded = encodeDiscoverObjectCursor({
      sort: 'newest',
      created_at: '2019-04-11T13:33:22.034Z',
      weight: 1.5,
      object_id: 'obj-1',
    });
    const decoded = decodeDiscoverObjectCursor(encoded);
    expect(decoded).toEqual({
      sort: 'newest',
      created_at: '2019-04-11T13:33:22.034Z',
      weight: 1.5,
      object_id: 'obj-1',
    });
  });

  it('returns null for invalid cursor', () => {
    expect(decodeDiscoverObjectCursor('not-valid')).toBeNull();
  });

  it('returns null when created_at is missing', () => {
    const legacy = Buffer.from(
      JSON.stringify({ sort: 'newest', seq: 42, weight: null, object_id: 'x' }),
      'utf8',
    ).toString('base64url');
    expect(decodeDiscoverObjectCursor(legacy)).toBeNull();
  });

  it('coerces string weight to number', () => {
    const encoded = Buffer.from(
      JSON.stringify({
        sort: 'rank',
        created_at: '2019-04-11T13:33:22.034Z',
        weight: '9.712621939999998',
        object_id: 'obj-1',
      }),
      'utf8',
    ).toString('base64url');
    expect(decodeDiscoverObjectCursor(encoded)).toEqual({
      sort: 'rank',
      created_at: '2019-04-11T13:33:22.034Z',
      weight: 9.712621939999998,
      object_id: 'obj-1',
    });
  });
});
