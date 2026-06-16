export type CaseTransformMode = 'sentence' | 'lower' | 'upper' | 'title' | 'toggle';

export function toLowercaseCase(text: string): string {
  return text.toLowerCase();
}

export function toUppercaseCase(text: string): string {
  return text.toUpperCase();
}

export function toSentenceCase(text: string): string {
  if (!text) {
    return '';
  }
  const lower = text.toLowerCase();
  return lower.replace(
    /(^\s*|[.!?]\s+)(\p{L})/gu,
    (_, prefix: string, letter: string) => prefix + letter.toUpperCase(),
  );
}

function capitalizeToken(token: string): string {
  return token.replace(/(^|[-])(\p{L})(\p{L}*)/gu, (_, sep: string, first: string, rest: string) =>
    sep + first.toUpperCase() + rest.toLowerCase(),
  );
}

export function toCapitalizeEachWord(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : capitalizeToken(part)))
    .join('');
}

export function toToggleCase(text: string): string {
  return text.replace(/\p{L}/gu, (letter) =>
    letter === letter.toUpperCase() ? letter.toLowerCase() : letter.toUpperCase(),
  );
}

export function applyCaseTransform(text: string, mode: CaseTransformMode): string {
  switch (mode) {
    case 'sentence':
      return toSentenceCase(text);
    case 'lower':
      return toLowercaseCase(text);
    case 'upper':
      return toUppercaseCase(text);
    case 'title':
      return toCapitalizeEachWord(text);
    case 'toggle':
      return toToggleCase(text);
  }
}
