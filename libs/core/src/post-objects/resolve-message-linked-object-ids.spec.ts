import {
  MAX_MESSAGE_LINKED_OBJECT_IDS,
  resolveMessageLinkedObjectIds,
} from './resolve-message-linked-object-ids';

describe('resolveMessageLinkedObjectIds', () => {
  const existing = new Set(['dish-1', 'rest-1']);

  it('extracts /object/ slug that exists in core', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: 'see /object/dish-1',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual(['dish-1']);
  });

  it('extracts hashtag object id that exists in core', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: 'try #dish-1 tonight',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual(['dish-1']);
  });

  it('excludes the native object id', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: '/object/rest-1 and /object/dish-1',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual(['dish-1']);
  });

  it('drops ids not in existingObjectIds', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: '/object/ghost-id /object/dish-1',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual(['dish-1']);
  });

  it('returns empty when body has no object refs', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: 'hello',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual([]);
  });

  it('caps at 20 unique ids after self-exclude', () => {
    const manyExisting = new Set(
      ['rest-1', ...Array.from({ length: 25 }, (_, i) => `o${i + 1}`)],
    );
    const body = Array.from({ length: 25 }, (_, i) => `/object/o${i + 1}`).join(' ');
    const result = resolveMessageLinkedObjectIds({
      body,
      nativeObjectId: 'rest-1',
      existingObjectIds: manyExisting,
    });
    expect(result).toHaveLength(MAX_MESSAGE_LINKED_OBJECT_IDS);
    expect(result[0]).toBe('o1');
    expect(result).not.toContain('rest-1');
  });

  it('returns empty for empty or whitespace body', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: '',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual([]);
    expect(
      resolveMessageLinkedObjectIds({
        body: '   ',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual([]);
  });

  it('dedupes duplicate refs', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: '/object/dish-1 #dish-1 /object/dish-1',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual(['dish-1']);
  });

  it('extracts /object/ slug from full URL', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: 'https://waiviodev.com/object/dish-1/reviews',
        nativeObjectId: 'rest-1',
        existingObjectIds: existing,
      }),
    ).toEqual(['dish-1']);
  });

  it('ignores # inside URL fragments', () => {
    expect(
      resolveMessageLinkedObjectIds({
        body: 'https://x.com/page#nested-page',
        nativeObjectId: 'rest-1',
        existingObjectIds: new Set(['nested-page']),
      }),
    ).toEqual([]);
  });
});
