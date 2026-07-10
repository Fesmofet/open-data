import { categoryObjectsQuerySchema } from './category-objects-query.schema';

describe('categoryObjectsQuerySchema', () => {
  it('requires a non-empty name', () => {
    const result = categoryObjectsQuerySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('coerces limit and applies default', () => {
    const result = categoryObjectsQuerySchema.parse({ name: 'Skirts', limit: '10' });
    expect(result.limit).toBe(10);
  });

  it('defaults limit to 20', () => {
    const result = categoryObjectsQuerySchema.parse({ name: 'Skirts' });
    expect(result.limit).toBe(20);
  });

  it('accepts optional cursor and exclude_object_id', () => {
    const result = categoryObjectsQuerySchema.parse({
      name: 'Active Skirts',
      cursor: 'abc',
      exclude_object_id: 'obj-1',
    });
    expect(result.cursor).toBe('abc');
    expect(result.exclude_object_id).toBe('obj-1');
  });

  it('rejects limit above 50', () => {
    const result = categoryObjectsQuerySchema.safeParse({ name: 'Skirts', limit: 51 });
    expect(result.success).toBe(false);
  });
});
