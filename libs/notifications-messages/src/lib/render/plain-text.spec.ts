import type { NotificationMessage } from '../message';
import {
  renderPlainText,
  renderTelegramBody,
  resolveNotificationAbsoluteUrl,
} from './plain-text';

const dictionary = {
  notification_transfer_username_amount: '{username} transferred {amount} to you',
};

const message: NotificationMessage = {
  key: 'notification_transfer_username_amount',
  params: { username: 'wiv01', amount: '0.001 HIVE' },
  href: '/@flowmaster/transfers?type=transfer',
  icon: 'wallet',
  actor: 'wiv01',
};

describe('plain-text render', () => {
  it('renderTelegramBody returns template without URL', () => {
    expect(renderTelegramBody(message, dictionary)).toBe(
      'wiv01 transferred 0.001 HIVE to you',
    );
  });

  it('resolveNotificationAbsoluteUrl builds absolute link', () => {
    expect(
      resolveNotificationAbsoluteUrl(message, 'https://waiviodev.com/'),
    ).toBe('https://waiviodev.com/@flowmaster/transfers?type=transfer');
  });

  it('renderPlainText appends URL for legacy plain-text consumers', () => {
    expect(
      renderPlainText(message, dictionary, {
        baseUrl: 'https://waiviodev.com',
      }),
    ).toBe(
      'wiv01 transferred 0.001 HIVE to you\nhttps://waiviodev.com/@flowmaster/transfers?type=transfer',
    );
  });
});
