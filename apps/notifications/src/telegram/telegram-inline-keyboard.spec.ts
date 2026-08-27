import {
  buildNotificationInlineKeyboard,
  buildSubscriptionListInlineKeyboard,
  parseUnsubscribeCallbackData,
} from './telegram-inline-keyboard';

describe('telegram-inline-keyboard', () => {
  it('builds website and unsubscribe rows', () => {
    expect(
      buildNotificationInlineKeyboard(
        'flowmaster',
        'https://waiviodev.com/@flowmaster/transfers?type=HIVE',
      ),
    ).toEqual({
      inline_keyboard: [
        [
          {
            text: 'Go to website',
            url: 'https://waiviodev.com/@flowmaster/transfers?type=transfer',
          },
        ],
        [
          {
            text: 'Unsubscribe flowmaster',
            callback_data: 'unsubscribe:flowmaster',
          },
        ],
      ],
    });
  });

  it('builds unsubscribe-only keyboard when website url is missing', () => {
    expect(buildNotificationInlineKeyboard('flowmaster')).toEqual({
      inline_keyboard: [
        [{ text: 'Unsubscribe flowmaster', callback_data: 'unsubscribe:flowmaster' }],
      ],
    });
  });

  it('parses unsubscribe callback data', () => {
    expect(parseUnsubscribeCallbackData('unsubscribe:flowmaster')).toBe(
      'flowmaster',
    );
    expect(parseUnsubscribeCallbackData('other:flowmaster')).toBeNull();
  });

  it('builds subscription list rows with profile link and unsubscribe', () => {
    expect(
      buildSubscriptionListInlineKeyboard(
        ['flowmaster', 'wiv01'],
        'https://waiviodev.com',
      ),
    ).toEqual({
      inline_keyboard: [
        [
          { text: 'flowmaster', url: 'https://waiviodev.com/@flowmaster' },
          {
            text: 'Unsubscribe flowmaster',
            callback_data: 'unsubscribe:flowmaster',
          },
        ],
        [
          { text: 'wiv01', url: 'https://waiviodev.com/@wiv01' },
          {
            text: 'Unsubscribe wiv01',
            callback_data: 'unsubscribe:wiv01',
          },
        ],
      ],
    });
  });
});
