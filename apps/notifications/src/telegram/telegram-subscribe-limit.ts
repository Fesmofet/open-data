/**
 * Plans which Hive usernames to subscribe when a chat has a max account cap.
 * Already-subscribed names do not consume free slots (re-subscribe is idempotent).
 */
export function planChatSubscriptions(
  currentAccounts: readonly string[],
  requestedNames: readonly string[],
  maxAccounts: number,
): { namesToSubscribe: string[]; limitRejected: string[] } {
  const current = new Set(
    currentAccounts.map((a) => a.trim().toLowerCase()).filter(Boolean),
  );
  let freeSlots = Math.max(0, maxAccounts - current.size);
  const namesToSubscribe: string[] = [];
  const limitRejected: string[] = [];
  const seenInRequest = new Set<string>();

  for (const raw of requestedNames) {
    const name = raw.trim().toLowerCase();
    if (name.length === 0 || seenInRequest.has(name)) {
      continue;
    }
    seenInRequest.add(name);
    if (current.has(name)) {
      namesToSubscribe.push(name);
      continue;
    }
    if (freeSlots > 0) {
      namesToSubscribe.push(name);
      freeSlots -= 1;
    } else {
      limitRejected.push(name);
    }
  }

  return { namesToSubscribe, limitRejected };
}
