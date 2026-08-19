/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import type { ChannelDetail } from '../domain/messaging.types';
import { EditGroupModal } from './edit-group-modal';

jest.mock('../infrastructure/messaging-validate.client', () => ({
  validateChannelMembers: jest.fn().mockResolvedValue({ results: [] }),
}));

jest.mock('@/config/ipfs-content-base-provider', () => ({
  useIpfsContentBaseUrl: () => 'https://cdn.example.com',
}));

jest.mock('@/shared/presentation', () => ({
  AppModal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  AppModalCloseButton: ({ onClose, ariaLabel }: { onClose: () => void; ariaLabel: string }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClose}>
      Close
    </button>
  ),
  IpfsImageDropZone: () => <div>dropzone</div>,
}));

const messages = {
  messaging_edit_group: 'Edit',
  messaging_edit_group_title: 'Group name',
  messaging_edit_group_photo: 'Group photo',
  messaging_edit_group_save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
} as Messages;

const channel: ChannelDetail = {
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
  members: [{ account: 'alice', role: 'admin' }],
  viewer_role: 'admin',
  leave_policy: {
    can_leave: true,
    requires_successor: false,
    eligible_successors: [],
  },
};

describe('EditGroupModal', () => {
  it('disables save until title changes', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <EditGroupModal open channel={channel} viewerUsername="alice" onClose={jest.fn()} onSave={jest.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(screen.getByDisplayValue('Team'), { target: { value: 'Renamed' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
