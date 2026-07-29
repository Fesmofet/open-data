import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { NotificationRouterService } from './notification-router.service';
import type { NotificationFeedService } from './notification-feed.service';
import type { RecipientStrategyRegistry } from './routing/recipient-strategies';
import type { NotificationSettingsService } from './settings/notification-settings.service';
import type { SubscriptionService } from '../ws/subscription.service';
import type { TelegramNotificationService } from '../telegram/telegram-notification.service';

describe('NotificationRouterService', () => {
  const feedService = {
    buildItemFromEvent: jest.fn((e: AnyNotificationEvent) => ({ id: '1', ...e })),
    addToFeed: jest.fn(),
  } as unknown as NotificationFeedService;

  const recipientRegistry = {
    resolveRecipients: jest.fn(),
  } as unknown as RecipientStrategyRegistry;

  const settingsService = {
    isAllowed: jest.fn().mockResolvedValue(true),
    prefetchSettings: jest.fn().mockResolvedValue(new Map()),
  } as unknown as NotificationSettingsService;

  const subscriptionService = {
    notifyTrxProcessed: jest.fn(),
  } as unknown as SubscriptionService;

  const telegramNotification = {
    enqueue: jest.fn(),
  } as unknown as TelegramNotificationService;

  let router: NotificationRouterService;

  beforeEach(() => {
    jest.clearAllMocks();
    router = new NotificationRouterService(
      feedService,
      subscriptionService,
      recipientRegistry,
      settingsService,
      telegramNotification,
    );
  });

  it('skips object_created', async () => {
    await router.route({
      type: 'object_created',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 't',
      objectId: 'o',
      actor: 'a',
      payload: { updateId: 'u', updateType: 'title' },
    });
    expect(feedService.addToFeed).not.toHaveBeenCalled();
  });

  it('routes follow to following account', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock).mockResolvedValue(['bob']);
    await router.route({
      type: 'follow',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 't',
      objectId: null,
      actor: 'alice',
      payload: { following: 'bob', action: 'follow' },
    });
    expect(feedService.addToFeed).toHaveBeenCalledWith('bob', expect.any(Object));
  });

  it('routes update_vote_cast recipients from registry', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock).mockResolvedValue([
      'creator',
      'admin1',
      'bellUser',
    ]);

    await router.route({
      type: 'update_vote_cast',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 't',
      objectId: 'obj-1',
      actor: 'voter',
      payload: { updateId: 'u1', vote: 'valid' },
    });

    expect(feedService.addToFeed).toHaveBeenCalledTimes(3);
  });

  it('notifies trx subscribers', async () => {
    await router.route({
      type: 'trx_processed',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'trx-abc',
      objectId: null,
      actor: null,
      payload: {},
    });
    expect(subscriptionService.notifyTrxProcessed).toHaveBeenCalledWith(
      'trx-abc',
      expect.objectContaining({ blockNum: 1 }),
    );
  });
});
