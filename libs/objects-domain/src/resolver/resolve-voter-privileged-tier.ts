import type { GovernanceSnapshot } from '../types/governance-snapshot';
import type { ObjectOwnership } from '@opden-data-layer/odl-db-types';

export type VoterPrivilegedTier = 'admin' | 'trusted';

/**
 * Whether a voter counts as admin (LWAW) or trusted with object authority (LWTW)
 * for validity display — mirrors {@link resolveUpdateValidity} tier rules.
 */
export function resolveVoterPrivilegedTier(
  voter: string,
  governance: GovernanceSnapshot,
  ownerships: ObjectOwnership[],
): VoterPrivilegedTier | null {
  if (governance.admins.includes(voter)) {
    return 'admin';
  }

  const accountsWithExclusiveOwnership = new Set(
    ownerships.filter((o) => o.ownership_type === 'exclusive').map((o) => o.account),
  );
  if (governance.trusted.includes(voter) && accountsWithExclusiveOwnership.has(voter)) {
    return 'trusted';
  }

  return null;
}
