export type VotersPageCursor = {
  sortKey: string;
  voter: string;
};

export function encodeVotersCursor(cursor: VotersPageCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeVotersCursor(raw: string | undefined): VotersPageCursor | null {
  const trimmed = raw?.trim() ?? '';
  if (trimmed === '') {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(trimmed, 'base64url').toString('utf8')) as {
      sortKey?: unknown;
      voter?: unknown;
    };
    if (typeof parsed.sortKey !== 'string' || typeof parsed.voter !== 'string') {
      return null;
    }
    if (parsed.voter.trim() === '') {
      return null;
    }
    return { sortKey: parsed.sortKey, voter: parsed.voter };
  } catch {
    return null;
  }
}
