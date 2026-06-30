import { resolveNestedObjectsBodySchema } from './resolve-nested-objects.schema';

describe('resolveNestedObjectsBodySchema', () => {
  it('accepts valid body with ids only', () => {
    const r = resolveNestedObjectsBodySchema.safeParse({
      ids: ['obj1'],
    });
    expect(r.success).toBe(true);
  });

  it('accepts valid update_types', () => {
    const r = resolveNestedObjectsBodySchema.safeParse({
      ids: ['obj1'],
      update_types: ['name', 'pageContent'],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.update_types).toEqual(['name', 'pageContent']);
    }
  });

  it('accepts empty update_types (endpoint defaults at runtime)', () => {
    const r = resolveNestedObjectsBodySchema.safeParse({
      ids: ['obj1'],
      update_types: [],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.update_types).toEqual([]);
    }
  });

  it('rejects empty ids array', () => {
    const r = resolveNestedObjectsBodySchema.safeParse({
      ids: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown update_type', () => {
    const r = resolveNestedObjectsBodySchema.safeParse({
      ids: ['obj1'],
      update_types: ['not_a_real_update_type'],
    });
    expect(r.success).toBe(false);
  });
});
