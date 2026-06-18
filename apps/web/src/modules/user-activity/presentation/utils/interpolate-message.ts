/** Simple `{var}` / `${var}` replacement for catalog strings without a full ICU layer. */
export function interpolateMessage(
  template: string,
  vars: Record<string, string>,
): string {
  return Object.entries(vars).reduce((text, [key, value]) => {
    return text
      .replaceAll(`{${key}}`, value)
      .replaceAll(`\${${key}}`, value);
  }, template);
}
