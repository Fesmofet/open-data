/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { DeleteMessageModal } from './delete-message-modal';

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
  messaging_delete_confirm_title: 'Delete message?',
  messaging_delete_confirm_body: 'This permanently removes the message from the channel.',
  messaging_action_delete: 'Delete',
  cancel: 'Cancel',
  close: 'Close',
} as Messages;

describe('DeleteMessageModal', () => {
  it('shows a visible destructive confirm button (theme error tokens)', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <DeleteMessageModal open onClose={jest.fn()} onConfirm={jest.fn()} />
      </I18nProvider>,
    );

    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm.className).toContain('bg-error');
    expect(confirm.className).toContain('text-error-fg');
    expect(confirm.className).not.toContain('bg-danger');
  });

  it('calls onConfirm when delete is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <DeleteMessageModal open onClose={jest.fn()} onConfirm={onConfirm} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
