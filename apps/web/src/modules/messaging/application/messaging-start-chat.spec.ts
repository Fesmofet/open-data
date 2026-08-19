import {
  buildDmHref,
  buildGroupChannelHref,
  resolveStartChatAction,
} from './messaging-start-chat';
import { validateGroupInvitees } from '../infrastructure/messaging-validate.client';

jest.mock('../infrastructure/messaging-validate.client', () => ({
  validateGroupInvitees: jest.fn(),
}));

const validateGroupInviteesMock = validateGroupInvitees as jest.MockedFunction<
  typeof validateGroupInvitees
>;

describe('messaging-start-chat', () => {
  beforeEach(() => {
    validateGroupInviteesMock.mockReset();
  });

  it('returns noop for empty peers', async () => {
    await expect(resolveStartChatAction('alice', 'alice', { peers: [] })).resolves.toEqual({
      kind: 'noop',
    });
  });

  it('returns dm action for a single peer', async () => {
    await expect(
      resolveStartChatAction('alice', 'alice', { peers: [' bob '] }),
    ).resolves.toEqual({
      kind: 'dm',
      peer: 'bob',
      href: '/@alice/messages?peer=bob',
    });
  });

  it('filters invitees and returns group action', async () => {
    validateGroupInviteesMock.mockResolvedValue({
      results: [
        { account: 'bob', addable: true, reason: null },
        { account: 'carol', addable: false, reason: 'muted' },
      ],
    });

    await expect(
      resolveStartChatAction('alice', 'alice', {
        peers: ['bob', 'carol'],
        title: 'Team',
      }),
    ).resolves.toEqual({
      kind: 'group',
      members: ['bob'],
      title: 'Team',
    });
  });

  it('returns noop when no invitees are addable', async () => {
    validateGroupInviteesMock.mockResolvedValue({
      results: [
        { account: 'bob', addable: false, reason: 'muted' },
        { account: 'carol', addable: false, reason: 'muted' },
      ],
    });

    await expect(
      resolveStartChatAction('alice', 'alice', { peers: ['bob', 'carol'] }),
    ).resolves.toEqual({ kind: 'noop' });
  });

  it('buildGroupChannelHref and buildDmHref', () => {
    expect(buildGroupChannelHref('alice', 'grp-1')).toBe('/@alice/messages?channel=grp-1');
    expect(buildDmHref('alice', 'bob')).toBe('/@alice/messages?peer=bob');
  });
});
