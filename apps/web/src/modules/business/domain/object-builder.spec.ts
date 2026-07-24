import {
  createEmptyRow,
  DANGEROUS_OBJECT_BUILDER_KEYS,
  OBJECT_BUILDER_LIMITS,
  recordToRows,
  rowsToRecord,
  validateRows,
  type ObjectBuilderRow,
} from './object-builder';

function row(
  partial: Partial<ObjectBuilderRow> & Pick<ObjectBuilderRow, 'key' | 'type'>,
): ObjectBuilderRow {
  return {
    id: partial.id ?? `row-${partial.key}`,
    value: partial.value ?? '',
    boolValue: partial.boolValue ?? false,
    children: partial.children ?? [],
    items: partial.items ?? [],
    ...partial,
  };
}

describe('rowsToRecord', () => {
  it('maps scalar types', () => {
    const rows: ObjectBuilderRow[] = [
      row({ key: 'title', type: 'string', value: 'Camping mapper' }),
      row({ key: 'priority', type: 'number', value: '10' }),
      row({ key: 'published', type: 'boolean', boolValue: true }),
      row({ key: 'empty', type: 'null' }),
    ];
    expect(rowsToRecord(rows)).toEqual({
      title: 'Camping mapper',
      priority: 10,
      published: true,
      empty: null,
    });
  });

  it('maps nested object and array', () => {
    const rows: ObjectBuilderRow[] = [
      row({
        key: 'metadata',
        type: 'object',
        children: [
          row({ key: 'rating', type: 'number', value: '4.8' }),
          row({ key: 'featured', type: 'boolean', boolValue: true }),
        ],
      }),
      row({
        key: 'tags',
        type: 'array',
        items: [
          { id: 'a1', type: 'string', value: 'alpha', boolValue: false },
          { id: 'a2', type: 'number', value: '2', boolValue: false },
        ],
      }),
    ];
    expect(rowsToRecord(rows)).toEqual({
      metadata: { rating: 4.8, featured: true },
      tags: ['alpha', 2],
    });
  });

  it('skips rows with empty keys', () => {
    expect(rowsToRecord([row({ key: '', type: 'string', value: 'ignored' })])).toEqual({});
  });
});

describe('recordToRows and round-trip', () => {
  it('round-trips a mixed record', () => {
    const source = {
      title: 'Camping mapper',
      priority: 10,
      published: true,
      metadata: { rating: 4.8, featured: true },
      tags: ['alpha', 2, true, null],
    };
    expect(rowsToRecord(recordToRows(source))).toEqual(source);
  });

  it('stringifies unsupported nested values at max depth', () => {
    const source = { deep: { nested: { x: 1 } } };
    const rebuilt = rowsToRecord(recordToRows(source));
    expect(rebuilt.deep).toEqual({ nested: '{"x":1}' });
  });
});

describe('validateRows', () => {
  it('allows a single blank starter row', () => {
    expect(validateRows([createEmptyRow()])).toEqual([]);
  });

  it('flags duplicate keys case-insensitively', () => {
    const issues = validateRows([
      row({ id: '1', key: 'Foo', type: 'string', value: 'a' }),
      row({ id: '2', key: 'foo', type: 'string', value: 'b' }),
    ]);
    expect(issues.some((i) => i.code === 'duplicate_key')).toBe(true);
  });

  it('flags dangerous keys', () => {
    for (const dangerous of DANGEROUS_OBJECT_BUILDER_KEYS) {
      const issues = validateRows([
        row({ id: 'd', key: dangerous, type: 'string', value: 'x' }),
      ]);
      expect(issues.some((i) => i.code === 'dangerous_key')).toBe(true);
    }
  });

  it('flags key too long and max properties', () => {
    const longKey = 'k'.repeat(OBJECT_BUILDER_LIMITS.maxKeyLength + 1);
    const tooLong = validateRows([
      row({ id: 'l', key: longKey, type: 'string', value: 'x' }),
    ]);
    expect(tooLong.some((i) => i.code === 'key_too_long')).toBe(true);

    const many = Array.from({ length: OBJECT_BUILDER_LIMITS.maxProperties + 1 }, (_, i) =>
      row({ id: `m${i}`, key: `key${i}`, type: 'string', value: 'v' }),
    );
    const maxProps = validateRows(many);
    expect(maxProps.some((i) => i.code === 'max_properties')).toBe(true);
  });

  it('flags empty key when multiple rows exist', () => {
    const issues = validateRows([
      row({ id: '1', key: 'a', type: 'string', value: '1' }),
      row({ id: '2', key: '', type: 'string', value: '2' }),
    ]);
    expect(issues.some((i) => i.code === 'empty_key')).toBe(true);
  });
});
