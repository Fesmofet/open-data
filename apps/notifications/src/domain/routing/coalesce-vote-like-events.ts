import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';

function voteLikePostKey(event: AnyNotificationEvent): string | null {
  if (event.type !== 'vote_like') {
    return null;
  }
  return `${event.payload.author}/${event.payload.permlink}`;
}

/**
 * Legacy in-batch dedup: one vote_like notification per post per stream batch.
 * Keeps the last event in batch order (highest likesCount after indexer enrichment).
 */
export function coalesceVoteLikeEvents(
  events: readonly AnyNotificationEvent[],
): AnyNotificationEvent[] {
  const lastIndexByPost = new Map<string, number>();
  for (let index = 0; index < events.length; index++) {
    const key = voteLikePostKey(events[index]);
    if (key != null) {
      lastIndexByPost.set(key, index);
    }
  }

  if (lastIndexByPost.size === 0) {
    return [...events];
  }

  const keptVoteLikeIndexes = new Set(lastIndexByPost.values());
  return events.filter((event, index) => {
    if (event.type !== 'vote_like') {
      return true;
    }
    return keptVoteLikeIndexes.has(index);
  });
}
