import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { NotificationRouterService } from './notification-router.service';
import { NotificationSettingsService } from './settings/notification-settings.service';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../constants/notification-settings.constants';
import type { NotificationFeedService } from './notification-feed.service';
import type { RecipientStrategyRegistry } from './routing/recipient-strategies';
import type { NotificationAudienceService } from './settings/notification-audience.service';
import type { SubscriptionService } from '../ws/subscription.service';
import type { TelegramNotificationService } from '../telegram/telegram-notification.service';

function voteLike(author: string, blockNum = 1): AnyNotificationEvent {
  return {
    type: 'vote_like',
    occurredAt: '2026-01-01T00:00:00.000Z',
    blockNum,
    trxId: null,
    objectId: null,
    actor: 'v',
    payload: { voter: 'v', author, permlink: 'p', weight: 1 },
  } as AnyNotificationEvent;
}

describe('NotificationRouterService', () => {
  let itemSeq = 0;

  const feedService = {
    buildItemFromEvent: jest.fn((e: AnyNotificationEvent) => ({
      id: `item-${++itemSeq}`,
      ...e,
    })),
    addManyToFeed: jest.fn(),
  } as unknown as NotificationFeedService;

  const recipientRegistry = {
    resolveRecipients: jest.fn(),
  } as unknown as RecipientStrategyRegistry;

  const audienceService = {
    load: jest.fn(),
  } as unknown as NotificationAudienceService;

  const subscriptionService = {
    notifyTrxProcessed: jest.fn(),
  } as unknown as SubscriptionService;

  const telegramNotification = {
    enqueueMany: jest.fn(),
  } as unknown as TelegramNotificationService;

  let router: NotificationRouterService;

  function audienceOf(
    accounts: string[],
    chatIds: Record<string, string[]> = {},
  ) {
    return {
      settingsByAccount: new Map(
        accounts.map((a) => [a, DEFAULT_NOTIFICATION_SETTINGS]),
      ),
      chatIdsByAccount: new Map(Object.entries(chatIds)),
      usdRates: null,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    itemSeq = 0;
    (audienceService.load as jest.Mock).mockResolvedValue(audienceOf([]));
    router = new NotificationRouterService(
      feedService,
      subscriptionService,
      recipientRegistry,
      new NotificationSettingsService(),
      audienceService,
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
    expect(recipientRegistry.resolveRecipients).not.toHaveBeenCalled();
    expect(feedService.addManyToFeed).not.toHaveBeenCalled();
  });

  it('routes follow to following account', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock).mockResolvedValue(['bob']);
    (audienceService.load as jest.Mock).mockResolvedValue(audienceOf(['bob']));

    await router.route({
      type: 'follow',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 't',
      objectId: null,
      actor: 'alice',
      payload: { following: 'bob', action: 'follow' },
    });

    expect(feedService.addManyToFeed).toHaveBeenCalledWith([
      { username: 'bob', item: expect.any(Object) },
    ]);
  });

  it('routes update_vote_cast recipients from registry', async () => {
    const recipients = ['creator', 'admin1', 'bellUser'];
    (recipientRegistry.resolveRecipients as jest.Mock).mockResolvedValue(
      recipients,
    );
    (audienceService.load as jest.Mock).mockResolvedValue(
      audienceOf(recipients),
    );

    await router.route({
      type: 'update_vote_cast',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 't',
      objectId: 'obj-1',
      actor: 'voter',
      payload: { updateId: 'u1', vote: 'valid' },
    });

    const entries = (feedService.addManyToFeed as jest.Mock).mock.calls[0][0];
    expect(entries).toHaveLength(3);
    expect(entries.map((e: { username: string }) => e.username)).toEqual(
      recipients,
    );
  });

  it('drops recipients that are not registered ODL users', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock).mockResolvedValue([
      'known',
      'stranger',
    ]);
    (audienceService.load as jest.Mock).mockResolvedValue(audienceOf(['known']));

    await router.route(voteLike('known'));

    expect(feedService.addManyToFeed).toHaveBeenCalledWith([
      { username: 'known', item: expect.any(Object) },
    ]);
  });

  it('loads the audience once for the whole batch and writes one feed pipeline', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock)
      .mockResolvedValueOnce(['alice'])
      .mockResolvedValueOnce(['bob'])
      .mockResolvedValueOnce(['stranger']);
    (audienceService.load as jest.Mock).mockResolvedValue(
      audienceOf(['alice', 'bob']),
    );

    await router.routeBatch([
      voteLike('alice', 1),
      voteLike('bob', 2),
      voteLike('stranger', 3),
    ]);

    expect(audienceService.load).toHaveBeenCalledTimes(1);
    expect(audienceService.load).toHaveBeenCalledWith(
      ['alice', 'bob', 'stranger'],
      false,
    );
    expect(feedService.addManyToFeed).toHaveBeenCalledTimes(1);
    expect(
      (feedService.addManyToFeed as jest.Mock).mock.calls[0][0],
    ).toHaveLength(2);
  });

  it('queues telegram only for subscribed accounts', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock)
      .mockResolvedValueOnce(['alice'])
      .mockResolvedValueOnce(['bob']);
    (audienceService.load as jest.Mock).mockResolvedValue(
      audienceOf(['alice', 'bob'], { bob: ['99'] }),
    );

    await router.routeBatch([voteLike('alice', 1), voteLike('bob', 2)]);

    expect(telegramNotification.enqueueMany).toHaveBeenCalledTimes(1);
    const requests = (telegramNotification.enqueueMany as jest.Mock).mock
      .calls[0][0];
    expect(requests).toEqual([
      {
        account: 'bob',
        chatIds: ['99'],
        event: expect.objectContaining({ blockNum: 2 }),
        itemId: expect.any(String),
      },
    ]);
  });

  it('respects gating settings without hitting the audience twice', async () => {
    (recipientRegistry.resolveRecipients as jest.Mock).mockResolvedValue([
      'alice',
    ]);
    (audienceService.load as jest.Mock).mockResolvedValue({
      settingsByAccount: new Map([
        ['alice', { ...DEFAULT_NOTIFICATION_SETTINGS, vote: false }],
      ]),
      chatIdsByAccount: new Map(),
      usdRates: null,
    });

    await router.route(voteLike('alice'));

    expect(feedService.addManyToFeed).not.toHaveBeenCalled();
    expect(audienceService.load).toHaveBeenCalledTimes(1);
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
