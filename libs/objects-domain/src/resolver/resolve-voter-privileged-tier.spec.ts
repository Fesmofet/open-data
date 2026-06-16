import type { ObjectAuthority } from '@opden-data-layer/core';

import { DEFAULT_GOVERNANCE_SNAPSHOT } from '../types/governance-snapshot';
import { resolveVoterPrivilegedTier } from './resolve-voter-privileged-tier';

const governance = {
  ...DEFAULT_GOVERNANCE_SNAPSHOT,
  admins: ['admin1'],
  trusted: ['trusted1', 'trusted2'],
};

const authorities: ObjectAuthority[] = [
  {
    object_id: 'obj1',
    account: 'trusted1',
    authority_type: 'ownership',
    created_at: new Date(0),
  },
];

describe('resolveVoterPrivilegedTier', () => {
  it('returns admin for governance admins', () => {
    expect(resolveVoterPrivilegedTier('admin1', governance, authorities)).toBe('admin');
  });

  it('returns trusted when voter is trusted and has object authority', () => {
    expect(resolveVoterPrivilegedTier('trusted1', governance, authorities)).toBe('trusted');
  });

  it('returns null for trusted without object authority', () => {
    expect(resolveVoterPrivilegedTier('trusted2', governance, authorities)).toBeNull();
  });

  it('returns null for community voters', () => {
    expect(resolveVoterPrivilegedTier('alice', governance, authorities)).toBeNull();
  });
});
