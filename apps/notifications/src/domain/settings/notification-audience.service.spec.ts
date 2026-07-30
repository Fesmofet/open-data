import type { CurrencyQueryService } from '@opden-data-layer/currency';
import { NotificationAudienceService } from './notification-audience.service';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../../constants/notification-settings.constants';
import type { NotificationRecipientsRepository } from '../../repositories/notification-recipients.repository';
import type { TelegramSubscriptionsRepository } from '../../repositories/telegram-subscriptions.repository';
import type { UserNotificationSettingsRepository } from '../../repositories/user-notification-settings.repository';

describe('NotificationAudienceService', () => {
  const settingsRepository = {
    findByAccounts: jest.fn(),
  } as unknown as UserNotificationSettingsRepository;

  const recipientsRepository = {
    findKnownAccounts: jest.fn(),
  } as unknown as NotificationRecipientsRepository;

  const telegramSubscriptions = {
    findChatIdsByAccounts: jest.fn(),
  } as unknown as TelegramSubscriptionsRepository;

  const currencyQuery = {
    legacyRateLatest: jest.fn(),
  } as unknown as CurrencyQueryService;

  let service: NotificationAudienceService;

  beforeEach(() => {
    jest.clearAllMocks();
    (settingsRepository.findByAccounts as jest.Mock).mockResolvedValue([]);
    (recipientsRepository.findKnownAccounts as jest.Mock).mockResolvedValue(
      new Set(),
    );
    (
      telegramSubscriptions.findChatIdsByAccounts as jest.Mock
    ).mockResolvedValue(new Map());
    service = new NotificationAudienceService(
      settingsRepository,
      recipientsRepository,
      telegramSubscriptions,
      currencyQuery,
    );
  });

  it('excludes accounts that are not registered ODL users', async () => {
    const audience = await service.load(['stranger'], false);

    expect(audience.settingsByAccount.size).toBe(0);
    expect(audience.settingsByAccount.has('stranger')).toBe(false);
  });

  it('returns the stored settings row when present', async () => {
    (settingsRepository.findByAccounts as jest.Mock).mockResolvedValue([
      { account: 'alice', ...DEFAULT_NOTIFICATION_SETTINGS, vote: false },
    ]);

    const audience = await service.load(['alice'], false);

    expect(audience.settingsByAccount.get('alice')).toEqual({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      vote: false,
    });
  });

  it('applies defaults to known accounts without a settings row', async () => {
    (recipientsRepository.findKnownAccounts as jest.Mock).mockResolvedValue(
      new Set(['bob']),
    );

    const audience = await service.load(['bob'], false);

    expect(audience.settingsByAccount.get('bob')).toEqual(
      DEFAULT_NOTIFICATION_SETTINGS,
    );
  });

  it('treats a telegram subscriber as a known account', async () => {
    (
      telegramSubscriptions.findChatIdsByAccounts as jest.Mock
    ).mockResolvedValue(new Map([['carol', ['42']]]));

    const audience = await service.load(['carol'], false);

    expect(audience.settingsByAccount.get('carol')).toEqual(
      DEFAULT_NOTIFICATION_SETTINGS,
    );
    expect(audience.chatIdsByAccount.get('carol')).toEqual(['42']);
  });

  it('loads USD rates once when requested', async () => {
    (currencyQuery.legacyRateLatest as jest.Mock).mockResolvedValue({
      HIVE: 0.25,
      HBD: 1,
    });

    const audience = await service.load(['alice', 'bob'], true);

    expect(currencyQuery.legacyRateLatest).toHaveBeenCalledTimes(1);
    expect(audience.usdRates).toEqual({ hive: 0.25, hbd: 1 });
  });

  it('skips rate lookup when the batch does not need it', async () => {
    const audience = await service.load(['alice'], false);

    expect(currencyQuery.legacyRateLatest).not.toHaveBeenCalled();
    expect(audience.usdRates).toBeNull();
  });

  it('queries each repository once for the whole batch', async () => {
    await service.load(['alice', 'alice', ' bob ', ''], false);

    expect(settingsRepository.findByAccounts).toHaveBeenCalledTimes(1);
    expect(settingsRepository.findByAccounts).toHaveBeenCalledWith([
      'alice',
      'bob',
    ]);
    expect(recipientsRepository.findKnownAccounts).toHaveBeenCalledTimes(1);
    expect(telegramSubscriptions.findChatIdsByAccounts).toHaveBeenCalledTimes(1);
  });
});
