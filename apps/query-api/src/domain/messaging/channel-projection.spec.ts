import { buildDmListTitle, buildDmPeer, buildLeavePolicy } from './channel-projection';

describe('channel-projection', () => {
  it('builds DM peer and list title', () => {
    expect(buildDmPeer(['alice', 'bob'], 'alice')).toBe('bob');
    expect(buildDmListTitle(['bob', 'alice'])).toBe('alice & bob');
  });

  it('requires successor for sole admin with multiple members', () => {
    const policy = buildLeavePolicy(
      [
        { channel_id: 'grp-1', account: 'alice', role: 'admin', joined_at_unix: 1, last_read_at_unix: null },
        { channel_id: 'grp-1', account: 'bob', role: 'member', joined_at_unix: 2, last_read_at_unix: null },
        { channel_id: 'grp-1', account: 'carol', role: 'member', joined_at_unix: 3, last_read_at_unix: null },
      ],
      'alice',
    );
    expect(policy).toEqual({
      can_leave: true,
      requires_successor: true,
      eligible_successors: ['bob', 'carol'],
    });
  });

  it('does not require successor for regular member', () => {
    const policy = buildLeavePolicy(
      [
        { channel_id: 'grp-1', account: 'alice', role: 'admin', joined_at_unix: 1, last_read_at_unix: null },
        { channel_id: 'grp-1', account: 'bob', role: 'member', joined_at_unix: 2, last_read_at_unix: null },
      ],
      'bob',
    );
    expect(policy.requires_successor).toBe(false);
    expect(policy.can_leave).toBe(true);
  });
});
