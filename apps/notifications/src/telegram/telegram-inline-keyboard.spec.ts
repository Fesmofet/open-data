import {
  buildNotificationInlineKeyboard,
  parseUnsubscribeCallbackData,
} from './telegram-inline-keyboard';

describe('telegram-inline-keyboard', () => {
  it('builds website and unsubscribe rows', () => {
    expect(
      buildNotificationInlineKeyboard(
        'flowmaster',
        'https://waiviodev.com/@flowmaster/transfers?type=transfer',
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
});
