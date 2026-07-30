import { Injectable, Logger } from '@nestjs/common';
import { CurrencyQueryService } from '@opden-data-layer/currency';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsView,
} from '../../constants/notification-settings.constants';
import { NotificationRecipientsRepository } from '../../repositories/notification-recipients.repository';
import { TelegramSubscriptionsRepository } from '../../repositories/telegram-subscriptions.repository';
import { UserNotificationSettingsRepository } from '../../repositories/user-notification-settings.repository';
import type { UsdRates } from './notification-settings.service';

export interface NotificationAudience {
  /**
   * Registered ODL accounts only. Accounts absent from this map receive nothing —
   * this mirrors the legacy lookup against the Waivio `users` collection.
   */
  readonly settingsByAccount: ReadonlyMap<string, NotificationSettingsView>;
  readonly chatIdsByAccount: ReadonlyMap<string, string[]>;
  readonly usdRates: UsdRates | null;
}

const EMPTY_AUDIENCE: NotificationAudience = {
  settingsByAccount: new Map(),
  chatIdsByAccount: new Map(),
  usdRates: null,
};

/**
 * Resolves, in bulk for a whole batch, which accounts may receive notifications and how.
 * @see docs/apps/notifications/spec/transport.md
 */
@Injectable()
export class NotificationAudienceService {
  private readonly logger = new Logger(NotificationAudienceService.name);

  constructor(
    private readonly settingsRepository: UserNotificationSettingsRepository,
    private readonly recipientsRepository: NotificationRecipientsRepository,
    private readonly telegramSubscriptions: TelegramSubscriptionsRepository,
    private readonly currencyQuery: CurrencyQueryService,
  ) {}

  async load(
    accounts: string[],
    withUsdRates: boolean,
  ): Promise<NotificationAudience> {
    const unique = [
      ...new Set(accounts.map((a) => a.trim()).filter((a) => a.length > 0)),
    ];
    if (unique.length === 0) {
      return EMPTY_AUDIENCE;
    }

    const [settingsRows, knownAccounts, chatIdsByAccount, usdRates] =
      await Promise.all([
        this.settingsRepository.findByAccounts(unique),
        this.recipientsRepository.findKnownAccounts(unique),
        this.telegramSubscriptions.findChatIdsByAccounts(unique),
        withUsdRates ? this.loadUsdRates() : Promise.resolve(null),
      ]);

    const settingsByAccount = new Map<string, NotificationSettingsView>();
    for (const row of settingsRows) {
      const { account, ...view } = row;
      settingsByAccount.set(account, view);
    }

    // A stored settings row is the strongest signal, but an ODL user may not have one yet;
    // `user_metadata` and an active Telegram subscription both mark the account as known.
    for (const account of knownAccounts) {
      if (!settingsByAccount.has(account)) {
        settingsByAccount.set(account, DEFAULT_NOTIFICATION_SETTINGS);
      }
    }
    for (const account of chatIdsByAccount.keys()) {
      if (!settingsByAccount.has(account)) {
        settingsByAccount.set(account, DEFAULT_NOTIFICATION_SETTINGS);
      }
    }

    return { settingsByAccount, chatIdsByAccount, usdRates };
  }

  private async loadUsdRates(): Promise<UsdRates | null> {
    try {
      const rates = await this.currencyQuery.legacyRateLatest(
        'USD',
        'HIVE,HBD',
      );
      return {
        hive: Number(rates?.HIVE ?? 0),
        hbd: Number(rates?.HBD ?? 0),
      };
    } catch (e) {
      this.logger.error(`Failed to load USD rates: ${(e as Error).message}`);
      return null;
    }
  }
}
