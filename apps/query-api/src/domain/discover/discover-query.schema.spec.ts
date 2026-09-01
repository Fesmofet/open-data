import {
  discoverBoxSchema,
  discoverObjectsQuerySchema,
} from './discover-query.schema';

describe('discoverBoxSchema', () => {
  it('accepts a valid box string', () => {
    const parsed = discoverBoxSchema.safeParse('-123.2,49.1,-123.0,49.3');
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        swLng: -123.2,
        swLat: 49.1,
        neLng: -123.0,
        neLat: 49.3,
      });
    }
  });

  it('rejects a malformed box string', () => {
    expect(discoverBoxSchema.safeParse('-123.2,49.1').success).toBe(false);
  });
});

describe('discoverObjectsQuerySchema limit', () => {
  it('accepts the marker page size at the documented maximum', () => {
    expect(discoverObjectsQuerySchema.safeParse({ limit: 50 }).success).toBe(true);
  });

  it('rejects limit above the maximum', () => {
    expect(discoverObjectsQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });
});
