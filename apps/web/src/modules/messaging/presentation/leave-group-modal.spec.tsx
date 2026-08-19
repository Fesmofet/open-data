/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import type { ChannelDetail } from '../domain/messaging.types';
import { EMPTY_LEAVE_POLICY } from '../domain/messaging.types';
import { LeaveGroupModal } from './leave-group-modal';

jest.mock('@/shared/presentation', () => ({
  AppModal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  AppModalCloseButton: ({ onClose, ariaLabel }: { onClose: () => void; ariaLabel: string }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClose}>
      Close
    </button>
  ),
}));

const messages = {
  messaging_leave_group: 'Leave group',
  messaging_leave_confirm: 'Leave',
  messaging_leave_group_confirm: 'Leave {title}?',
  messaging_leave_delete_messages: 'Delete all my messages in this group',
  messaging_leave_delete_messages_hint: 'Hint',
  messaging_leave_select_admin: 'Choose new admin',
  messaging_leave_select_admin_placeholder: 'Select a member',
  messaging_leave_select_admin_required: 'Select a new admin before leaving.',
  cancel: 'Cancel',
  close: 'Close',
} as Messages;

const baseChannel: ChannelDetail = {
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
  leave_policy: {
    can_leave: true,
    requires_successor: false,
    eligible_successors: [],
  },
};

function renderModal(
  props: Partial<React.ComponentProps<typeof LeaveGroupModal>> = {},
) {
  const onConfirm = jest.fn();
  render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <LeaveGroupModal
        open
        onClose={jest.fn()}
        channel={baseChannel}
        leavePolicy={baseChannel.leave_policy}
        onConfirm={onConfirm}
        {...props}
      />
    </I18nProvider>,
  );
  return { onConfirm };
}

describe('LeaveGroupModal', () => {
  it('keeps delete-messages checkbox unchecked by default', () => {
    renderModal();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('shows a visible confirm action', () => {
    renderModal();
    const confirm = screen.getByRole('button', { name: 'Leave' });
    expect(confirm).toBeEnabled();
    expect(confirm.className).toContain('bg-error');
  });

  it('requires successor when policy requires it', () => {
    renderModal({
      leavePolicy: {
        can_leave: true,
        requires_successor: true,
        eligible_successors: ['bob'],
      },
    });
    expect(screen.getByRole('button', { name: 'Leave' })).toBeDisabled();
    expect(screen.getByText('Select a new admin before leaving.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bob' } });
    expect(screen.getByRole('button', { name: 'Leave' })).toBeEnabled();
  });

  it('passes delete flag when checkbox checked', () => {
    const { onConfirm } = renderModal();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onConfirm).toHaveBeenCalledWith({
      successorAdmin: undefined,
      deleteMyMessages: true,
    });
  });

  it('disables confirm when cannot leave', () => {
    renderModal({ leavePolicy: EMPTY_LEAVE_POLICY });
    expect(screen.getByRole('button', { name: 'Leave' })).toBeDisabled();
  });
});
