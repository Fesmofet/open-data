import { buildDmListTitle, buildDmPeer } from './channel-projection';

describe('channel-projection', () => {
  it('builds DM peer and list title', () => {
    expect(buildDmPeer(['alice', 'bob'], 'alice')).toBe('bob');
    expect(buildDmListTitle(['bob', 'alice'])).toBe('alice & bob');
  });
});
