import { objectTypeExamplePayload } from './object-type-serializer';

describe('objectTypeExamplePayload', () => {
  it('includes creator in object_create payload', () => {
    const payload = objectTypeExamplePayload('recipe');
    expect(payload).toContain('creator');
    expect(payload).toContain("object_type: 'recipe'");
  });
});
