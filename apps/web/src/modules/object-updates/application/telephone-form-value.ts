/** Default form state for a new `telephone` update. */
export function initialTelephoneFormValue(): Record<string, unknown> {
  return {
    title: '',
    value: '',
  };
}

/** Strip empty optional fields before Zod validation. */
export function sanitizeTelephoneFormValue(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  if (typeof out.title === 'string' && out.title.trim() === '') {
    delete out.title;
  }
  if (typeof out.value === 'string') {
    out.value = out.value.trim();
  }
  return out;
}
