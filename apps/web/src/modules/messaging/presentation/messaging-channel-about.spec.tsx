/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import type { ChannelDetail } from '../domain/messaging.types';
import { MessagingChannelAbout } from './messaging-channel-about';

jest.mock('@/config/ipfs-content-base-provider', () => ({
  useIpfsContentBaseUrl: () => 'https://cdn.example.com',
}));

jest.mock('@/shared/presentation', () => ({
  UserAvatar: ({ username }: { username: string }) => <span>{username}</span>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = {
  messaging_about: 'About',
  messaging_members: 'Members',
  messaging_members_count: '{count} members',
  messaging_members_more: '+{count} more',
  messaging_edit_group: 'Edit',
  messaging_leave_group: 'Leave group',
} as Messages;

const groupChannel: ChannelDetail = {
  channel_id: 'grp-1',
  kind: 'group',
  creator: 'alice',
  title: 'Team',
  image: null,
  object_id: null,
  access: 'members_only',
  display_title: 'Team',
  list_title: 'Team',
  peer: null,
  members: [
    { account: 'alice', role: 'admin' },
    { account: 'bob', role: 'member' },
  ],
  viewer_role: 'admin',
  leave_policy: { can_leave: true, requires_successor: false, eligible_successors: [] },
};

describe('MessagingChannelAbout', () => {
  it('shows edit under member count and leave at bottom for group admin', () => {
    const { container } = render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingChannelAbout
          channel={groupChannel}
          variant="rail"
          onEdit={jest.fn()}
          onLeave={jest.fn()}
        />
      </I18nProvider>,
    );
    const aboutHeading = screen.getByRole('heading', { name: 'About' });
    expect(aboutHeading.className).toContain('text-center');
    const avatarPlaceholder = container.querySelector('.mx-auto.size-\\[4\\.5rem\\]');
    expect(avatarPlaceholder).toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: 'Edit' });
    const leaveButton = screen.getByRole('button', { name: 'Leave group' });
    const memberCount = screen.getByText('2 members');
    const membersHeading = screen.getByRole('heading', { name: 'Members' });

    expect(editButton).toBeInTheDocument();
    expect(leaveButton).toBeInTheDocument();
    expect(
      memberCount.compareDocumentPosition(editButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      membersHeading.compareDocumentPosition(leaveButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('hides edit for non-admin member', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingChannelAbout
          channel={{
            ...groupChannel,
            viewer_role: 'member',
            leave_policy: { can_leave: true, requires_successor: false, eligible_successors: [] },
          }}
          onEdit={jest.fn()}
          onLeave={jest.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave group' })).toBeInTheDocument();
  });

  it('hides leave when policy disallows', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingChannelAbout
          channel={{
            ...groupChannel,
            leave_policy: { can_leave: false, requires_successor: false, eligible_successors: [] },
          }}
          onEdit={jest.fn()}
          onLeave={jest.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Leave group' })).not.toBeInTheDocument();
  });

  it('hides member roster for object channels', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingChannelAbout
          channel={{
            ...groupChannel,
            channel_id: 'obj-ch-1',
            kind: 'object',
            object_id: 'obj-1',
            members: [{ account: 'legacy', role: 'member' }],
            viewer_role: null,
            leave_policy: {
              can_leave: false,
              requires_successor: false,
              eligible_successors: [],
            },
          }}
          variant="rail"
        />
      </I18nProvider>,
    );

    expect(screen.queryByText('1 members')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Members' })).not.toBeInTheDocument();
  });
});
