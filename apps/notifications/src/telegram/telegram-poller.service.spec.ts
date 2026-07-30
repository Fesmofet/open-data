import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
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
  } as unknown as TelegramSubscriptionsRepository;

  let poller: TelegramPollerService;

  beforeEach(() => {
    jest.clearAllMocks();
    poller = new TelegramPollerService(
      { get: jest.fn() } as unknown as ConfigService,
      { getClient: jest.fn() } as unknown as RedisClientFactory,
      api,
      subscriptions,
    );
  });

  it('unsubscribes account from callback_query button', async () => {
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
      'Unsubscribed: flowmaster',
    );
  });
});
