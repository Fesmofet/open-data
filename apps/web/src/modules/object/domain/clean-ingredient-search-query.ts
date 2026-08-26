/**
 * Legacy Waivio ingredient cleaner for discover search only — not display text.
 * @see tmp/waivio-frontend-legacy/src/client/social-gifts/SocialProduct/socialProductHelper.js
 */

/** Sorted longest-first so multi-word phrases match before shorter tokens. */
const INGREDIENT_SEARCH_STOP_WORDS = [
  'enough to cover the meat in the pot',
  'for the filling and frosting',
  'your choice of meat',
  'a squeeze of',
  'room temperature',
  'for toasting',
  'for drizzling',
  'for garnish',
  'for serving',
  'for topping',
  'for frying',
  'as needed',
  'to taste',
  'hard-boiled',
  'high-quality',
  'cut into',
  'teaspoon',
  'tablespoon',
  'milliliter',
  'kilogram',
  'quartered',
  'marinated',
  'condensed',
  'sautéed',
  'sauteed',
  'package',
  'optional',
  'version',
  'organic',
  'overripe',
  'boneless',
  'skinless',
  'shredded',
  'coarsely',
  'finely',
  'softened',
  'toasted',
  'roasted',
  'simmered',
  'steamed',
  'broiled',
  'grilled',
  'seasoned',
  'blended',
  'preheat',
  'combine',
  'knead',
  'sprinkle',
  'garnish',
  'arrange',
  'unsalted',
  'chilled',
  'drained',
  'cooked',
  'boiled',
  'fried',
  'baked',
  'cooked',
  'beaten',
  'whipped',
  'mashed',
  'melted',
  'halved',
  'chopped',
  'crushed',
  'ground',
  'peeled',
  'seeded',
  'cored',
  'diced',
  'minced',
  'sliced',
  'grated',
  'handful',
  'quart',
  'gallon',
  'liter',
  'ounce',
  'pound',
  'stick',
  'fillet',
  'sprig',
  'stalk',
  'strip',
  'chunk',
  'drizzle',
  'splash',
  'layer',
  'clove',
  'slice',
  'piece',
  'bunch',
  'block',
  'pinch',
  'dash',
  'pint',
  'gram',
  'grams',
  'large',
  'small',
  'medium',
  'whole',
  'fresh',
  'dried',
  'salted',
  'frozen',
  'canned',
  'light',
  'dark',
  'lean',
  'thick',
  'thinly',
  'thin',
  'tender',
  'firm',
  'ripe',
  'pure',
  'head',
  'pour',
  'spread',
  'blend',
  'whisk',
  'fold',
  'toss',
  'fill',
  'stuff',
  'serve',
  'stir',
  'mix',
  'coat',
  'cook',
  'grill',
  'broil',
  'bake',
  'fry',
  'cup',
  'cups',
  'tsp',
  'tbsp',
  'ml',
  'kg',
  'lb',
  'lbs',
  'oz',
  'g',
  'can',
  'jar',
  'and',
  'etc',
  'for',
  'the',
  'a',
  'of',
  'or',
  '-sized',
] as const;

const INGREDIENT_NUMBER_WORDS = [
  'eleven',
  'twelve',
  'dozen',
  'quarter',
  'eight',
  'seven',
  'three',
  'four',
  'five',
  'nine',
  'ten',
  'six',
  'two',
  'one',
  'half',
] as const;

const EMOJI_PATTERN = /\p{Extended_Pictographic}|\uFE0F/gu;

const QUANTITIES_AND_PUNCTUATION =
  /(\d+|\u00BC|\u00BD|\u00BE|\u2150|\u2151|\u2152|\u2153|\u2154|\u2155|\u2156|\u2157|\u2158|\u2159|\u215A|\u215B|\u215C|\u215D|\u215E)\s*(g(?![a-zA-Z])|kg|ml|l|oz|tsp|tbsp|cup|cups|pint|quart|gallon|pound|lbs?|lb)?|[()%/,;.!:\u2014\u2013-]/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildStopWordPattern(words: readonly string[]): RegExp {
  const parts = [...words]
    .sort((a, b) => b.length - a.length)
    .map((word) => `\\b${escapeRegExp(word)}s?\\b`);
  return new RegExp(`(${parts.join('|')})`, 'gi');
}

const STOP_WORD_PATTERN = buildStopWordPattern(INGREDIENT_SEARCH_STOP_WORDS);
const NUMBER_WORD_PATTERN = buildStopWordPattern(INGREDIENT_NUMBER_WORDS);

/**
 * Derives a discover FTS `q` string from a stored recipe ingredient line.
 * Display text must remain the raw stored value.
 */
export function cleanIngredientSearchQuery(ingredient: string): string {
  const trimmed = ingredient.trim();
  if (!trimmed) {
    return '';
  }

  let text = trimmed
    .replace(EMOJI_PATTERN, ' ')
    .replace(STOP_WORD_PATTERN, ' ')
    .replace(QUANTITIES_AND_PUNCTUATION, ' ')
    .replace(NUMBER_WORD_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}
