/** Builds a `tel:` href from a human-formatted phone string. */
export function telephoneHref(number: string): string {
  const digits = number.replace(/[^\d+]/g, '');
  return digits.length > 0 ? `tel:${digits}` : '#';
}
