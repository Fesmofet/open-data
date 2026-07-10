import {
  decodeCategoryObjectsCursor,
  encodeCategoryObjectsCursor,
} from './category-objects-cursor';

describe('category-objects-cursor', () => {
  it('round-trips weight and object_id', () => {
    const payload = { weight: 12.5, object_id: 'obj-1' };
    const encoded = encodeCategoryObjectsCursor(payload);
    expect(decodeCategoryObjectsCursor(encoded)).toEqual(payload);
  });

  it('round-trips null weight', () => {
    const payload = { weight: null, object_id: 'obj-2' };
    const encoded = encodeCategoryObjectsCursor(payload);
    expect(decodeCategoryObjectsCursor(encoded)).toEqual(payload);
  });

  it('rejects invalid cursor', () => {
    expect(decodeCategoryObjectsCursor('')).toBeNull();
    expect(decodeCategoryObjectsCursor('not-base64')).toBeNull();
    expect(decodeCategoryObjectsCursor(encodeCategoryObjectsCursor({ weight: 1, object_id: '' }))).toBeNull();
  });

  it('coerces string weight from JSON', () => {
    const encoded = Buffer.from(
      JSON.stringify({ weight: '12.5', object_id: 'obj-3' }),
      'utf8',
    ).toString('base64url');
    expect(decodeCategoryObjectsCursor(encoded)).toEqual({
      weight: 12.5,
      object_id: 'obj-3',
    });
  });
});
