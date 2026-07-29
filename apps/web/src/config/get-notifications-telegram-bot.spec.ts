jest.mock('server-only', () => ({}));

import {
  getNotificationsTelegramBotUrl,
  getNotificationsTelegramBotUsername,
} from './get-notifications-telegram-bot';

describe('getNotificationsTelegramBot', () => {
  const original = process.env.NOTIFICATIONS_TELEGRAM_BOT_USERNAME;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NOTIFICATIONS_TELEGRAM_BOT_USERNAME;
    } else {
      process.env.NOTIFICATIONS_TELEGRAM_BOT_USERNAME = original;
    }
  });

  it('defaults to WaivioNotificationsBot', () => {
    delete process.env.NOTIFICATIONS_TELEGRAM_BOT_USERNAME;
    expect(getNotificationsTelegramBotUsername()).toBe('WaivioNotificationsBot');
    expect(getNotificationsTelegramBotUrl()).toBe(
      'https://t.me/WaivioNotificationsBot',
    );
  });

  it('strips leading @ from env', () => {
    process.env.NOTIFICATIONS_TELEGRAM_BOT_USERNAME = '@MyBot';
    expect(getNotificationsTelegramBotUsername()).toBe('MyBot');
    expect(getNotificationsTelegramBotUrl()).toBe('https://t.me/MyBot');
  });
});
