import { UPDATE_METADATA, UPDATE_METADATA_SCHEMA } from './metadata';

describe('UPDATE_METADATA', () => {
  it('accepts key/value pairs', () => {
    expect(UPDATE_METADATA_SCHEMA.safeParse({ key: 'author', value: 'alice' }).success).toBe(
      true,
    );
  });

  it('rejects empty key or value', () => {
    expect(UPDATE_METADATA_SCHEMA.safeParse({ key: '', value: 'x' }).success).toBe(false);
    expect(UPDATE_METADATA_SCHEMA.safeParse({ key: 'k', value: '' }).success).toBe(false);
  });

  it('is multi-cardinality json', () => {
    expect(UPDATE_METADATA.cardinality).toBe('multi');
    expect(UPDATE_METADATA.value_kind).toBe('json');
  });
});
