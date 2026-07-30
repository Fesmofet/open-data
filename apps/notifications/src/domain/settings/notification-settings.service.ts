import { Injectable } from '@nestjs/common';
import type {
  AnyNotificationEvent,
  NotificationEventType,
} from '@opden-data-layer/notifications-contract';
import type { UserNotificationSettings } from '@opden-data-layer/core';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';
import {
  NOTIFICATION_SETTINGS_CACHE_TTL_SEC,
  notificationSettingsCacheKey,
} from '../../constants/notification-settings.constants';
import { UserNotificationSettingsRepository } from '../../repositories/user-notification-settings.repository';

type SettingsColumn = keyof Pick<
  UserNotificationSettings,
  | 'follow'
  | 'reply'
  | 'mention'
  | 'reblog'
  | 'vote'
  | 'downvote'
  | 'my_post'
  | 'my_comment'
  | 'my_like'
  | 'transfer'
  | 'power_up'
  | 'claim_reward'
  | 'witness_vote'
  | 'fill_order'
  | 'claimed_object_updates'
  | 'group_id_control'
  | 'followed_user_threads'
>;

const TYPE_TO_SETTING: Partial<Record<NotificationEventType, SettingsColumn>> = {
  follow: 'follow',
  reply: 'reply',
  mention: 'mention',
  reblog: 'reblog',
  vote_like: 'vote',
  my_post: 'my_post',
  my_comment: 'my_comment',
  my_vote: 'my_like',
  transfer_in: 'transfer',
  transfer_out: 'transfer',
  transfer_from_savings: 'transfer',
  engine_transfer: 'transfer',
  power_up: 'power_up',
  power_down: 'transfer',
  claim_reward: 'claim_reward',
  witness_vote: 'witness_vote',
  fill_order: 'fill_order',
  bell_thread: 'followed_user_threads',
  thread_author_follower: 'followed_user_threads',
  object_update: 'claimed_object_updates',
  object_update_reject: 'claimed_object_updates',
  update_vote_cast: 'claimed_object_updates',
};

const MINIMAL_TRANSFER_TYPES = new Set<NotificationEventType>([
  'transfer_in',
  'engine_transfer',
]);

const GROUP_ID_UPDATE_TYPES = new Set<NotificationEventType>([
  'object_update',
  'object_update_reject',
]);

@Injectable()
export class NotificationSettingsService {
  constructor(
    private readonly settingsRepository: UserNotificationSettingsRepository,
    private readonly redisFactory: RedisClientFactory,
    private readonly currencyQuery: CurrencyQueryService,
  ) {}

  async prefetchSettings(
    accounts: string[],
  ): Promise<Map<string, UserNotificationSettings | null>> {
    const unique = [...new Set(accounts.map((a) => a.trim()).filter(Boolean))];
    const map = new Map<string, UserNotificationSettings | null>();
    await Promise.all(
      unique.map(async (account) => {
        map.set(account, await this.getSettings(account));
      }),
    );
    return map;
  }

  async isAllowed(
    account: string,
    event: AnyNotificationEvent,
    prefetched?: Map<string, UserNotificationSettings | null>,
  ): Promise<boolean> {
    const settings =
      prefetched?.get(account.trim()) ?? (await this.getSettings(account));
    return this.isAllowedWithSettings(settings, event);
  }

  async isAllowedWithSettings(
    settings: UserNotificationSettings | null,
    event: AnyNotificationEvent,
  ): Promise<boolean> {
    if (!settings) {
      return true;
    }

    if (event.type === 'vote_downvote' && settings.downvote === false) {
      return false;
    }

    const column = TYPE_TO_SETTING[event.type];
    if (column && settings[column] === false) {
      return false;
    }

    if (GROUP_ID_UPDATE_TYPES.has(event.type)) {
      if (
        settings.group_id_control === false &&
        (event.type === 'object_update' || event.type === 'object_update_reject') &&
        event.payload.updateType === UPDATE_TYPES.PRODUCT_GROUP_ID
      ) {
        return false;
      }
    }

    if (MINIMAL_TRANSFER_TYPES.has(event.type)) {
      if (event.type === 'transfer_in' || event.type === 'engine_transfer') {
        return this.passesMinimalTransfer(
          event.payload.amount,
          event.payload.symbol,
          settings.minimal_transfer,
        );
      }
    }

    return true;
  }

  private async getSettings(
    account: string,
  ): Promise<UserNotificationSettings | null> {
    const cacheKey = notificationSettingsCacheKey(account);
    const redis = this.redisFactory.getClient();
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserNotificationSettings;
      }
    } catch {
      // fall through to DB
    }

    const row = await this.settingsRepository.findByAccount(account);
    if (row) {
      try {
        await redis.set(
          cacheKey,
          JSON.stringify(row),
          NOTIFICATION_SETTINGS_CACHE_TTL_SEC,
        );
      } catch {
        // ignore cache write errors
      }
    }
    return row;
  }

  private async passesMinimalTransfer(
    amount: string,
    symbol: string,
    minimalUsd: number,
  ): Promise<boolean> {
    if (minimalUsd <= 0) {
      return true;
    }
    const numeric = parseFloat(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return true;
    }

    try {
      const rates = await this.currencyQuery.legacyRateLatest('USD', 'HIVE,HBD');
      const upper = symbol.toUpperCase();
      const hiveUsd = Number(rates?.HIVE ?? 0);
      const hbdUsd = Number(rates?.HBD ?? 0);
      let usd = 0;
      if (upper === 'HIVE' && hiveUsd > 0) {
        usd = numeric * hiveUsd;
      } else if (upper === 'HBD' && hbdUsd > 0) {
        usd = numeric * hbdUsd;
      } else {
        return true;
      }
      return usd >= minimalUsd;
    } catch {
      return true;
    }
  }
}
