import type { GovernanceSnapshot } from '../types/governance-snapshot';
import { ObjectAuthority } from '@opden-data-layer/odl-db-types';

export type VoterPrivilegedTier = 'admin' | 'trusted';

/**
 * Whether a voter counts as admin (LWAW) or trusted with object authority (LWTW)
 * for validity display — mirrors {@link resolveUpdateValidity} tier rules.
 */
export function resolveVoterPrivilegedTier(
  voter: string,
  governance: GovernanceSnapshot,
  objectAuthorities: ObjectAuthority[],
): VoterPrivilegedTier | null {
  if (governance.admins.includes(voter)) {
    return 'admin';
  }

  const accountsWithAuthority = new Set(objectAuthorities.map((a) => a.account));
  if (governance.trusted.includes(voter) && accountsWithAuthority.has(voter)) {
    return 'trusted';
  }

  return null;
}
