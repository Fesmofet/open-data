import type { ChannelMember } from '@opden-data-layer/core';

export function buildDmListTitle(members: readonly string[]): string {
  return [...members].sort((a, b) => a.localeCompare(b)).join(' & ');
}

export function buildDmPeer(
  members: readonly string[],
  viewer: string,
): string | null {
  const peer = members.find((m) => m !== viewer);
  return peer ?? null;
}

export function memberAccounts(members: ChannelMember[]): string[] {
  return members.map((m) => m.account);
}
