import {
  buildJsonSchema,
  createEmptySchemaPropertyRow,
  emptyValueFromSchema,
  parseJsonSchema,
  type SchemaPropertyRow,
} from './service-order-schema';

function row(
  partial: Partial<SchemaPropertyRow> & Pick<SchemaPropertyRow, 'key' | 'type'>,
): SchemaPropertyRow {
  return {
    ...createEmptySchemaPropertyRow(),
    ...partial,
    id: partial.id ?? `row-${partial.key}`,
  };
}

describe('buildJsonSchema and parseJsonSchema', () => {
  it('round-trips a simple schema', () => {
    const rows: SchemaPropertyRow[] = [
      row({
        key: 'id',
        type: 'string',
        description: 'Product id',
        required: true,
      }),
    ];
    const built = buildJsonSchema(rows);
    const parsed = parseJsonSchema(built);
    expect(parsed[0]?.key).toBe('id');
    expect(parsed[0]?.required).toBe(true);
    expect(parsed[0]?.description).toBe('Product id');
  });
});

describe('emptyValueFromSchema', () => {
  it('returns empty strings and nested object defaults', () => {
    const schema = buildJsonSchema([
      row({
        key: 'id',
        type: 'string',
        required: true,
      }),
      row({
        key: 'meta',
        type: 'object',
        children: [row({ key: 'featured', type: 'boolean' })],
      }),
    ]);
    expect(emptyValueFromSchema(schema)).toEqual({
      id: '',
      meta: { featured: false },
    });
  });
});
