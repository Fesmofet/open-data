/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { MessageActionsMenu } from './message-actions-menu';

const messages = {
  messaging_action_edit: 'Edit',
  messaging_action_copy: 'Copy',
  messaging_action_reply: 'Reply',
  messaging_action_delete: 'Delete',
} as Messages;

describe('MessageActionsMenu', () => {
  it('renders delete with error tokens and edit before delete', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessageActionsMenu
          actions={{ edit: true, delete: true, copy: true, reply: true }}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onCopy={jest.fn()}
          onReply={jest.fn()}
        />
      </I18nProvider>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Edit',
      'Copy',
      'Reply',
      'Delete',
    ]);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton.className).toContain('text-error');
    expect(deleteButton.className).not.toContain('text-danger');
  });

  it('invokes delete handler', () => {
    const onDelete = jest.fn();
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessageActionsMenu
          actions={{ edit: false, delete: true, copy: false, reply: false }}
          onDelete={onDelete}
        />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
