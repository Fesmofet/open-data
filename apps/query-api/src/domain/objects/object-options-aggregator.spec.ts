import {
  aggregateObjectOptions,
  emptyObjectOptionsResponse,
  parseOptionRowsFromFields,
} from './object-options-aggregator';

describe('object-options-aggregator', () => {
  it('parseOptionRowsFromFields reads valid option JSON rows', () => {
    const rows = parseOptionRowsFromFields({
      option: [
        { category: 'Color', value: 'Red', position: 2, image: 'https://x/red.png' },
        { category: 'Size', value: 'L' },
        { category: '', value: 'skip' },
        null,
      ],
    });
    expect(rows).toEqual([
      { category: 'Color', value: 'Red', position: 2, image: 'https://x/red.png' },
      { category: 'Size', value: 'L', position: 1 },
    ]);
  });

  it('aggregateObjectOptions groups by category, dedupes by value, sorts by position then value', () => {
    const result = aggregateObjectOptions('current', [
      {
        object_id: 'obj-a',
        optionRows: [
          { category: 'Size', value: '11', position: 2 },
          { category: 'Color', value: 'Boulder', position: 1, image: 'https://x/b.png' },
        ],
        price: '99',
        imageUrl: 'https://x/a.png',
      },
      {
        object_id: 'obj-b',
        optionRows: [
          { category: 'Size', value: '11', position: 1 },
          { category: 'Size', value: '10.5', position: 1 },
          { category: 'Color', value: 'Black', position: 1 },
        ],
        price: '109',
        imageUrl: 'https://x/b.png',
      },
    ]);

    expect(result.object_id).toBe('current');
    expect(result.options.Size).toEqual([
      {
        object_id: 'obj-b',
        category: 'Size',
        value: '10.5',
        position: 1,
        image: null,
        price: '109',
        imageUrl: 'https://x/b.png',
      },
      {
        object_id: 'obj-a',
        category: 'Size',
        value: '11',
        position: 2,
        image: null,
        price: '99',
        imageUrl: 'https://x/a.png',
      },
    ]);
    expect(result.options.Color).toHaveLength(2);
  });

  it('dedupes duplicate values using first sibling in load order', () => {
    const result = aggregateObjectOptions('current', [
      {
        object_id: 'first',
        optionRows: [{ category: 'Color', value: 'Red', position: 1 }],
        price: null,
        imageUrl: null,
      },
      {
        object_id: 'second',
        optionRows: [{ category: 'Color', value: 'Red', position: 1 }],
        price: null,
        imageUrl: null,
      },
    ]);

    expect(result.options.Color).toEqual([
      expect.objectContaining({ object_id: 'first', value: 'Red' }),
    ]);
  });

  it('emptyObjectOptionsResponse returns empty map', () => {
    expect(emptyObjectOptionsResponse('x')).toEqual({ object_id: 'x', options: {} });
  });
});
