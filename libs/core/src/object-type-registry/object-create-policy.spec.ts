import { getRequiredObjectCreateUpdates } from './object-create-policy';

describe('getRequiredObjectCreateUpdates', () => {
  it('returns name, description, image for recipe', () => {
    expect(getRequiredObjectCreateUpdates('recipe')).toEqual(
      expect.arrayContaining(['name', 'description', 'image', 'ingredients']),
    );
  });

  it('includes ingredients only for recipe among common food types', () => {
    expect(getRequiredObjectCreateUpdates('dish')).toEqual(
      expect.arrayContaining(['name', 'description', 'image']),
    );
    expect(getRequiredObjectCreateUpdates('dish')).not.toContain('ingredients');
  });

  it('filters unsupported baseline fields for governance', () => {
    const required = getRequiredObjectCreateUpdates('governance');
    expect(required).toEqual(['name', 'image']);
    expect(required).not.toContain('description');
  });

  it('returns empty array for unknown object type', () => {
    expect(getRequiredObjectCreateUpdates('not-a-type')).toEqual([]);
  });

  it('includes skillContent for skill', () => {
    expect(getRequiredObjectCreateUpdates('skill')).toEqual(
      expect.arrayContaining(['name', 'description', 'image', 'skillContent']),
    );
  });
});
