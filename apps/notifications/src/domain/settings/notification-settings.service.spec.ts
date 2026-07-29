import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import type { UserNotificationSettings } from '@opden-data-layer/core';
import { NotificationSettingsService } from './notification-settings.service';
import type { UserNotificationSettingsRepository } from '../../repositories/user-notification-settings.repository';
import type { RedisClientFactory } from '@opden-data-layer/clients';
import type { CurrencyQueryService } from '@opden-data-layer/currency';

function baseSettings(
  overrides: Partial<UserNotificationSettings> = {},
): UserNotificationSettings {
  return {
    account: 'alice',
    activation_campaign: true,
    deactivation_campaign: true,
    follow: true,
    fill_order: true,
    mention: true,
    minimal_transfer: 0,
    reblog: true,
    reply: true,
    status_change: true,
    transfer: true,
    power_up: true,
    witness_vote: true,
    my_post: true,
    my_comment: true,
    my_like: true,
    vote: true,
    downvote: true,
    claim_reward: true,
    ...overrides,
  };
}

describe('NotificationSettingsService', () => {
  const settingsRepository = {
    findByAccount: jest.fn(),
  } as unknown as UserNotificationSettingsRepository;
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  };
  const redisFactory = {
    getClient: () => redis,
  } as unknown as RedisClientFactory;
  const currencyQuery = {
    legacyRateLatest: jest.fn(),
  } as unknown as CurrencyQueryService;

  let service: NotificationSettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationSettingsService(
      settingsRepository,
      redisFactory,
      currencyQuery,
    );
  });

  it('blocks vote_downvote when downvote setting is false', async () => {
    const settings = baseSettings({ downvote: false });
    const event = {
      type: 'vote_downvote',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'v',
      payload: { voter: 'v', author: 'a', permlink: 'p', weight: 1 },
    } as AnyNotificationEvent;

    const allowed = await service.isAllowedWithSettings(settings, event);
    expect(allowed).toBe(false);
  });

  it('applies minimal_transfer to engine_transfer inbound amounts', async () => {
    (currencyQuery.legacyRateLatest as jest.Mock).mockResolvedValue({
      HIVE: 0.5,
      HBD: 1,
    });
    const settings = baseSettings({ minimal_transfer: 10 });
    const event = {
      type: 'engine_transfer',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'from',
      payload: {
        from: 'from',
        to: 'bob',
        amount: '1',
        symbol: 'HIVE',
        memo: null,
      },
    } as AnyNotificationEvent;

    const allowed = await service.isAllowedWithSettings(settings, event);
    expect(allowed).toBe(false);
  });
});
