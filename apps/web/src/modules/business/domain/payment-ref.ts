const NOTE_KEYS = ['note', 'memo', 'report'] as const;

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function extractPaymentRefNote(
  ref: Record<string, unknown> | null | undefined,
): string | null {
  if (!ref) {
    return null;
  }
  for (const key of NOTE_KEYS) {
    const value = asTrimmedString(ref[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

export function parsePaymentRefAuthorperm(
  ref: Record<string, unknown> | null | undefined,
): { author: string; permlink: string } | null {
  const raw = asTrimmedString(ref?.authorperm);
  if (!raw) {
    return null;
  }
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  const slash = withoutAt.indexOf('/');
  if (slash <= 0) {
    return null;
  }
  const author = withoutAt.slice(0, slash).trim();
  const permlink = withoutAt.slice(slash + 1).trim();
  if (author === '' || permlink === '') {
    return null;
  }
  return { author, permlink };
}

export function getPartialRemainderSourceId(
  ref: Record<string, unknown> | null | undefined,
): string | null {
  const sourceId = ref?.partial_remainder_of;
  return typeof sourceId === 'string' && sourceId.trim().length > 0
    ? sourceId.trim()
    : null;
}
