import { DEFAULT_GOVERNANCE_SNAPSHOT } from '../types/governance-snapshot';
import { resolveVoterPrivilegedTier } from './resolve-voter-privileged-tier';
import { ObjectOwnership } from '@opden-data-layer/odl-db-types';

const governance = {
  ...DEFAULT_GOVERNANCE_SNAPSHOT,
  admins: ['admin1'],
  trusted: ['trusted1', 'trusted2'],
};

const ownerships: ObjectOwnership[] = [
  {
    object_id: 'obj1',
    account: 'trusted1',
    ownership_type: 'exclusive',
    event_seq: BigInt(1),
    created_at: new Date(0),
  },
];

describe('resolveVoterPrivilegedTier', () => {
  it('returns admin for governance admins', () => {
    expect(resolveVoterPrivilegedTier('admin1', governance, ownerships)).toBe('admin');
  });

  it('returns trusted when voter is trusted and has object authority', () => {
    expect(resolveVoterPrivilegedTier('trusted1', governance, ownerships)).toBe('trusted');
  });

  it('returns null for trusted without object authority', () => {
    expect(resolveVoterPrivilegedTier('trusted2', governance, ownerships)).toBeNull();
  });

  it('returns null for trusted with supervised ownership only', () => {
    const supervisedOnly: ObjectOwnership[] = [
      {
        object_id: 'obj1',
        account: 'trusted2',
        ownership_type: 'supervised',
        event_seq: BigInt(1),
        created_at: new Date(0),
      },
    ];
    expect(resolveVoterPrivilegedTier('trusted2', governance, supervisedOnly)).toBeNull();
  });

  it('returns null for community voters', () => {
    expect(resolveVoterPrivilegedTier('alice', governance, ownerships)).toBeNull();
  });
});
