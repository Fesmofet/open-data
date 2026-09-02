import { CHANNEL_KINDS } from '@opden-data-layer/core';

export const ORIGINAL_CREATED_AT_MAX_FUTURE_SEC = 86_400;

/** Persist stamp only on object channels when in [1, now+86400]. */
export function resolveOriginalCreatedAtUnix(input: {
  channelKind: string;
  stamp: number | undefined;
  nowUnix: number;
}): number | null {
  if (input.channelKind !== CHANNEL_KINDS[2]) {
    return null;
  }
  if (input.stamp === undefined) {
    return null;
  }
  const stamp = input.stamp;
  const max = input.nowUnix + ORIGINAL_CREATED_AT_MAX_FUTURE_SEC;
  if (stamp < 1 || stamp > max) {
    return null;
  }
  return stamp;
}
