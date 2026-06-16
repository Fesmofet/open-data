import {
  applyCaseTransform,
  toCapitalizeEachWord,
  toLowercaseCase,
  toSentenceCase,
  toToggleCase,
  toUppercaseCase,
} from './case-transform';

describe('toLowercaseCase', () => {
  it('lowercases mixed case', () => {
    expect(toLowercaseCase('Hello WORLD')).toBe('hello world');
  });

  it('returns empty string unchanged', () => {
    expect(toLowercaseCase('')).toBe('');
  });
});

describe('toUppercaseCase', () => {
  it('uppercases mixed case', () => {
    expect(toUppercaseCase('Hello world')).toBe('HELLO WORLD');
  });
});

describe('toSentenceCase', () => {
  it('capitalizes first letter and after sentence punctuation', () => {
    expect(toSentenceCase('hELLO WORLD. tEST NAME')).toBe('Hello world. Test name');
  });

  it('handles exclamation and question marks', () => {
    expect(toSentenceCase('hello! world? yes')).toBe('Hello! World? Yes');
  });

  it('returns empty string unchanged', () => {
    expect(toSentenceCase('')).toBe('');
  });

  it('preserves whitespace-only input', () => {
    expect(toSentenceCase('   ')).toBe('   ');
  });
});

describe('toCapitalizeEachWord', () => {
  it('capitalizes each word and hyphen segments', () => {
    expect(toCapitalizeEachWord('hello WORLD test-name')).toBe('Hello World Test-Name');
  });

  it('preserves multiple spaces', () => {
    expect(toCapitalizeEachWord('hello   world')).toBe('Hello   World');
  });

  it('handles apostrophes within a token', () => {
    expect(toCapitalizeEachWord("john's car")).toBe("John's Car");
  });

  it('handles digits and punctuation', () => {
    expect(toCapitalizeEachWord('item 2, test!')).toBe('Item 2, Test!');
  });

  it('leaves already correct text stable', () => {
    expect(toCapitalizeEachWord('Hello World')).toBe('Hello World');
  });
});

describe('toToggleCase', () => {
  it('inverts letter casing', () => {
    expect(toToggleCase('Hello WORLD')).toBe('hELLO world');
  });

  it('preserves non-letters', () => {
    expect(toToggleCase('Test-123!')).toBe('tEST-123!');
  });
});

describe('applyCaseTransform', () => {
  it('dispatches by mode', () => {
    expect(applyCaseTransform('Hello', 'lower')).toBe('hello');
    expect(applyCaseTransform('Hello', 'upper')).toBe('HELLO');
    expect(applyCaseTransform('hello world', 'title')).toBe('Hello World');
    expect(applyCaseTransform('Hello', 'toggle')).toBe('hELLO');
    expect(applyCaseTransform('hello. world', 'sentence')).toBe('Hello. World');
  });
});
