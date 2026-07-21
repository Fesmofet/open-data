export const STATUS_FORM_SELECTABLE_VALUES = [
  'unavailable',
  'closed',
  'privacy_erasure',
  'relisted',
  'nsfw',
  'flagged',
] as const;

export type SelectableStatusValue = (typeof STATUS_FORM_SELECTABLE_VALUES)[number];

export type StatusFormValue = {
  title: SelectableStatusValue;
  link?: string;
};

export function initialStatusFormValue(): StatusFormValue {
  return { title: 'unavailable' };
}

export function sanitizeStatusFormValue(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const rawTitle = typeof raw.title === 'string' ? raw.title : 'unavailable';
  const title: SelectableStatusValue = STATUS_FORM_SELECTABLE_VALUES.includes(
    rawTitle as SelectableStatusValue,
  )
    ? (rawTitle as SelectableStatusValue)
    : 'unavailable';

  if (title !== 'relisted') {
    return { title };
  }

  const link = typeof raw.link === 'string' ? raw.link.trim() : '';
  return link ? { title, link } : { title, link: '' };
}

export function parseStatusFormValue(value: unknown): StatusFormValue {
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const rawTitle = typeof obj.title === 'string' ? obj.title : 'unavailable';
  const title = STATUS_FORM_SELECTABLE_VALUES.includes(rawTitle as SelectableStatusValue)
    ? (rawTitle as SelectableStatusValue)
    : 'unavailable';
  const link = typeof obj.link === 'string' ? obj.link : '';
  if (title === 'relisted') {
    return { title, link };
  }
  return { title };
}
