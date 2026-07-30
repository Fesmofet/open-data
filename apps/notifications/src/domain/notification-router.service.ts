import { Injectable } from '@nestjs/common';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { NotificationFeedService } from './notification-feed.service';
import { RecipientStrategyRegistry } from './routing/recipient-strategies';
import { NotificationAudienceService } from './settings/notification-audience.service';
import { NotificationSettingsService } from './settings/notification-settings.service';
import { SubscriptionService } from '../ws/subscription.service';
import {
  TelegramNotificationService,
  type TelegramEnqueueRequest,
} from '../telegram/telegram-notification.service';
import type { UserNotificationItem } from './user-notification-item';

interface ResolvedEvent {
  event: AnyNotificationEvent;
  recipients: string[];
}

/**
 * Routes a whole batch of stream events at once: recipients and settings are resolved in bulk,
 * gating runs in memory, and fan-out uses a single Redis pipeline per sink.
 * @see docs/apps/notifications/spec/transport.md
 */
@Injectable()
export class NotificationRouterService {
  constructor(
    private readonly feedService: NotificationFeedService,
    private readonly subscriptionService: SubscriptionService,
    private readonly recipientRegistry: RecipientStrategyRegistry,
    private readonly settingsService: NotificationSettingsService,
    private readonly audienceService: NotificationAudienceService,
    private readonly telegramNotification: TelegramNotificationService,
  ) {}

  async route(event: AnyNotificationEvent): Promise<void> {
    await this.routeBatch([event]);
  }

  async routeBatch(events: AnyNotificationEvent[]): Promise<void> {
    const routable: AnyNotificationEvent[] = [];
    for (const event of events) {
      if (event.type === 'trx_processed') {
        this.routeTrxProcessed(event);
        continue;
      }
      if (event.type === 'object_created') {
        continue;
      }
      routable.push(event);
    }

    if (routable.length === 0) {
      return;
    }

    const resolved = await this.resolveRecipients(routable);
    if (resolved.length === 0) {
      return;
    }

    const audience = await this.audienceService.load(
      resolved.flatMap((entry) => entry.recipients),
      this.settingsService.needsUsdRates(routable),
    );
    if (audience.settingsByAccount.size === 0) {
      return;
    }

    const feedEntries: { username: string; item: UserNotificationItem }[] = [];
    const telegramRequests: TelegramEnqueueRequest[] = [];

    for (const { event, recipients } of resolved) {
      let item: UserNotificationItem | null = null;
      for (const username of recipients) {
        const settings = audience.settingsByAccount.get(username);
        if (!settings) {
          continue;
        }
        if (
          !this.settingsService.isAllowed(settings, event, audience.usdRates)
        ) {
          continue;
        }
        item ??= this.feedService.buildItemFromEvent(event);
        feedEntries.push({ username, item });
        const chatIds = audience.chatIdsByAccount.get(username);
        if (chatIds && chatIds.length > 0) {
          telegramRequests.push({
            account: username,
            chatIds,
            event,
            itemId: item.id,
          });
        }
      }
    }

    if (feedEntries.length === 0) {
      return;
    }

    await this.feedService.addManyToFeed(feedEntries);
    await this.telegramNotification.enqueueMany(telegramRequests);
  }

  private async resolveRecipients(
    events: AnyNotificationEvent[],
  ): Promise<ResolvedEvent[]> {
    const resolved = await Promise.all(
      events.map(async (event) => {
        const recipients = await this.recipientRegistry.resolveRecipients(event);
        return {
          event,
          recipients: [
            ...new Set(recipients.map((r) => r.trim()).filter(Boolean)),
          ],
        };
      }),
    );
    return resolved.filter((entry) => entry.recipients.length > 0);
  }

  private routeTrxProcessed(event: AnyNotificationEvent): void {
    if (event.type !== 'trx_processed') {
      return;
    }
    const trxId = event.trxId;
    if (!trxId) {
      return;
    }
    this.subscriptionService.notifyTrxProcessed(trxId, {
      blockNum: event.blockNum,
      occurredAt: event.occurredAt,
    });
  }
}
