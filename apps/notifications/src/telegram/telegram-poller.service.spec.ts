import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { TELEGRAM_SUBSCRIPTION_LIST_HEADER } from '../constants/telegram.constants';
import { TelegramApiClient } from './telegram-api.client';
import { TelegramPollerService } from './telegram-poller.service';
import type { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';

describe('TelegramPollerService', () => {
  const api = {
    isConfigured: jest.fn().mockReturnValue(true),
    getUpdates: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({ ok: true }),
    answerCallbackQuery: jest.fn().mockResolvedValue(undefined),
  } as unknown as TelegramApiClient;

  const subscriptions = {
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    findAccountsByChatId: jest.fn().mockResolvedValue(['flowmaster', 'wiv01']),
    accountExists: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn().mockResolvedValue(true),
  } as unknown as TelegramSubscriptionsRepository;

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'telegram.webPublicOrigin') {
        return 'https://waiviodev.com';
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  let poller: TelegramPollerService;

  beforeEach(() => {
    jest.clearAllMocks();
    poller = new TelegramPollerService(
      config,
      { getClient: jest.fn() } as unknown as RedisClientFactory,
      api,
      subscriptions,
    );
  });

  it('unsubscribes account from callback_query button and refreshes list', async () => {
    await (
      poller as unknown as {
        handleUpdate(update: unknown): Promise<void>;
      }
    ).handleUpdate({
      update_id: 1,
      callback_query: {
        id: 'cb-1',
        data: 'unsubscribe:flowmaster',
        message: { message_id: 1, chat: { id: 99 } },
      },
    });

    expect(api.answerCallbackQuery).toHaveBeenCalledWith('cb-1');
    expect(subscriptions.unsubscribe).toHaveBeenCalledWith('99', 'flowmaster');
    expect(api.sendMessage).toHaveBeenCalledWith(
      '99',
      TELEGRAM_SUBSCRIPTION_LIST_HEADER,
      expect.objectContaining({
        replyMarkup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      }),
    );
  });

  it('shows subscription list after username subscribe', async () => {
    (subscriptions.findAccountsByChatId as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['grampo', 'flowmaster', 'wiv01']);

    await (
      poller as unknown as {
        handleUpdate(update: unknown): Promise<void>;
      }
    ).handleUpdate({
      update_id: 2,
      message: {
        message_id: 2,
        chat: { id: 42 },
        text: 'grampo',
      },
    });

    expect(subscriptions.subscribe).toHaveBeenCalledWith('42', 'grampo');
    expect(api.sendMessage).toHaveBeenCalledWith(
      '42',
      TELEGRAM_SUBSCRIPTION_LIST_HEADER,
      expect.objectContaining({
        replyMarkup: {
          inline_keyboard: expect.arrayContaining([
            [
              { text: 'grampo', url: 'https://waiviodev.com/@grampo' },
              {
                text: 'Unsubscribe grampo',
                callback_data: 'unsubscribe:grampo',
              },
            ],
          ]),
        },
      }),
    );
  });
});
