import { cleanIngredientSearchQuery } from './clean-ingredient-search-query';

describe('cleanIngredientSearchQuery', () => {
  it('strips emoji, amounts, units, and filler from a typical ingredient line', () => {
    expect(cleanIngredientSearchQuery('🥬 8 lbs 8 oz Napa Cabbage (one large head)')).toBe(
      'Napa Cabbage',
    );
  });

  it('keeps simple ingredient names', () => {
    expect(cleanIngredientSearchQuery('🧂 Sea Salt')).toBe('Sea Salt');
  });

  it('preserves non-ASCII ingredient names', () => {
    expect(cleanIngredientSearchQuery('김치 2 cups')).toBe('김치');
    expect(cleanIngredientSearchQuery('🧄 Чеснок 3 cloves')).toBe('Чеснок');
  });

  it('returns empty when nothing searchable remains', () => {
    expect(cleanIngredientSearchQuery('🧂')).toBe('');
    expect(cleanIngredientSearchQuery('2 cups')).toBe('');
    expect(cleanIngredientSearchQuery('   ')).toBe('');
  });

  it('does not strip trailing s from ingredient nouns', () => {
    expect(cleanIngredientSearchQuery('1 lb asparagus')).toBe('asparagus');
  });
});
