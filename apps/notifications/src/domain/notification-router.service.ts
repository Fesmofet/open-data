import { Injectable } from '@nestjs/common';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { NotificationFeedService } from './notification-feed.service';
import { RecipientStrategyRegistry } from './routing/recipient-strategies';
import { NotificationSettingsService } from './settings/notification-settings.service';
import { SubscriptionService } from '../ws/subscription.service';

@Injectable()
export class NotificationRouterService {
  constructor(
    private readonly feedService: NotificationFeedService,
    private readonly subscriptionService: SubscriptionService,
    private readonly recipientRegistry: RecipientStrategyRegistry,
    private readonly settingsService: NotificationSettingsService,
  ) {}

  async route(event: AnyNotificationEvent): Promise<void> {
    if (event.type === 'trx_processed') {
      this.routeTrxProcessed(event);
      return;
    }
    if (event.type === 'object_created') {
      return;
    }

    const recipients = await this.recipientRegistry.resolveRecipients(event);
    if (recipients.length === 0) {
      return;
    }

    const item = this.feedService.buildItemFromEvent(event);
    const unique = [...new Set(recipients.map((r) => r.trim()).filter(Boolean))];
    const settingsByAccount =
      await this.settingsService.prefetchSettings(unique);

    for (const username of unique) {
      const allowed = await this.settingsService.isAllowed(
        username,
        event,
        settingsByAccount,
      );
      if (!allowed) {
        continue;
      }
      await this.feedService.addToFeed(username, item);
    }
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
