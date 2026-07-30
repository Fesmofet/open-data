import type { RedisClientFactory } from '@opden-data-layer/clients';
import { telegramSubscriptionsCacheKey } from '../constants/telegram.constants';
import type { TelegramSubscriptionsRepository } from '../repositories/telegram-subscriptions.repository';
import { TelegramSubscriptionsCacheService } from './telegram-subscriptions-cache.service';

describe('TelegramSubscriptionsCacheService', () => {
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
  const redisFactory = {
    getClient: () => redis,
  } as unknown as RedisClientFactory;
  const subscriptions = {
    findChatIdsByAccount: jest.fn().mockResolvedValue(['111']),
  } as unknown as TelegramSubscriptionsRepository;

  let service: TelegramSubscriptionsCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TelegramSubscriptionsCacheService(
      redisFactory,
      subscriptions,
    );
  });

  it('loads chat ids from repository on cache miss and caches result', async () => {
    const chatIds = await service.getChatIds('alice');

    expect(chatIds).toEqual(['111']);
    expect(subscriptions.findChatIdsByAccount).toHaveBeenCalledWith('alice');
    expect(redis.set).toHaveBeenCalledWith(
      telegramSubscriptionsCacheKey('alice'),
      JSON.stringify(['111']),
      expect.any(Number),
    );
  });

  it('returns cached chat ids without hitting repository', async () => {
    redis.get.mockResolvedValueOnce(JSON.stringify(['222']));

    const chatIds = await service.getChatIds('bob');

    expect(chatIds).toEqual(['222']);
    expect(subscriptions.findChatIdsByAccount).not.toHaveBeenCalled();
  });

  it('caches empty chat id lists', async () => {
    (subscriptions.findChatIdsByAccount as jest.Mock).mockResolvedValueOnce([]);

    const chatIds = await service.getChatIds('ghost');

    expect(chatIds).toEqual([]);
    expect(redis.set).toHaveBeenCalledWith(
      telegramSubscriptionsCacheKey('ghost'),
      '[]',
      expect.any(Number),
    );
  });

  it('invalidate deletes cache key', async () => {
    await service.invalidate('alice');

    expect(redis.del).toHaveBeenCalledWith(
      telegramSubscriptionsCacheKey('alice'),
    );
  });
});
