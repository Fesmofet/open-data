export type ValidityVotePreviewSide = 'for' | 'against';

/** Hover tooltip text for approve/reject vote counts. */
export function formatValidityVotePreview(
  count: number,
  previewVoters: readonly string[],
  t: (key: string) => string,
  side: ValidityVotePreviewSide,
): string | null {
  if (count <= 0) {
    return null;
  }

  const prefix =
    side === 'for'
      ? 'object_updates_vote_preview_for'
      : 'object_updates_vote_preview_against';
  const a = previewVoters[0];
  const b = previewVoters[1];

  if (count === 1 && a) {
    return t(`${prefix}_one`).replace('{user}', `@${a}`);
  }
  if (count === 2 && a && b) {
    return t(`${prefix}_two`)
      .replace('{first}', `@${a}`)
      .replace('{second}', `@${b}`);
  }
  if (a && b) {
    return t(`${prefix}_many`)
      .replace('{first}', `@${a}`)
      .replace('{second}', `@${b}`)
      .replace('{more}', String(Math.max(0, count - 2)));
  }
  return t(`${prefix}_count`).replace('{count}', String(count));
}
