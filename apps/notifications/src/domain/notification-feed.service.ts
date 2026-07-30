import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisClientFactory } from '@opden-data-layer/clients';
import type { NotificationEvent } from '@opden-data-layer/notifications-contract';
import {
  legacyNotificationListKey,
  NOTIFICATION_EXPIRY_SEC,
  NOTIFICATION_LIST_MAX,
  notificationListKey,
} from '../constants/notification-feed.constants';
import { ConnectionRegistryService } from '../ws/connection-registry.service';
import { wsSendJson } from '../ws/ws-message';
import type { UserNotificationItem } from './user-notification-item';

@Injectable()
export class NotificationFeedService {
  private readonly logger = new Logger(NotificationFeedService.name);

  constructor(
    private readonly redisFactory: RedisClientFactory,
    private readonly connectionRegistry: ConnectionRegistryService,
  ) {}

  buildItemFromEvent(event: NotificationEvent): UserNotificationItem {
    return {
      id: randomUUID(),
      type: event.type,
      occurredAt: event.occurredAt,
      blockNum: event.blockNum,
      trxId: event.trxId,
      objectId: event.objectId,
      actor: event.actor,
      payload: event.payload,
    };
  }

  async addToFeed(username: string, item: UserNotificationItem): Promise<void> {
    await this.addManyToFeed([{ username, item }]);
  }

  /**
   * Writes a whole batch with a single Redis pipeline. Items are pushed in the given order,
   * so the last item of the batch ends up at the head of the list (newest first).
   */
  async addManyToFeed(
    entries: { username: string; item: UserNotificationItem }[],
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const byUsername = new Map<string, string[]>();
    for (const { username, item } of entries) {
      const serialized = JSON.stringify(item);
      const existing = byUsername.get(username);
      if (existing) {
        existing.push(serialized);
        continue;
      }
      byUsername.set(username, [serialized]);
    }

    try {
      const pipe = this.redisFactory.getClient().pipeline();
      for (const [username, serialized] of byUsername) {
        const key = notificationListKey(username);
        pipe.lPush(key, ...serialized);
        pipe.expire(key, NOTIFICATION_EXPIRY_SEC);
        pipe.lTrim(key, 0, NOTIFICATION_LIST_MAX - 1);
      }
      await pipe.exec();
    } catch (err) {
      this.logger.error(`addManyToFeed failed: ${(err as Error).message}`);
      return;
    }

    for (const { username, item } of entries) {
      this.pushLive(username, item);
    }
  }

  async getFeed(username: string): Promise<UserNotificationItem[]> {
    const key = notificationListKey(username);
    const legacyKey = legacyNotificationListKey(username);
    try {
      const redis = this.redisFactory.getClient();
      const [raw, legacyRaw] = await Promise.all([
        redis.lRange(key, 0, -1),
        redis.lRange(legacyKey, 0, -1),
      ]);
      const merged = [...raw, ...legacyRaw];
      const items: UserNotificationItem[] = [];
      const seen = new Set<string>();
      for (const entry of merged) {
        try {
          const item = JSON.parse(entry) as UserNotificationItem;
          if (seen.has(item.id)) {
            continue;
          }
          seen.add(item.id);
          items.push(item);
        } catch {
          this.logger.warn(`Skipping corrupt notification entry for ${username}`);
        }
      }
      items.sort((a, b) => {
        const aMs = new Date(a.occurredAt).getTime();
        const bMs = new Date(b.occurredAt).getTime();
        if (Number.isNaN(aMs) || Number.isNaN(bMs)) {
          return 0;
        }
        return bMs - aMs;
      });
      return items.slice(0, NOTIFICATION_LIST_MAX);
    } catch (err) {
      this.logger.error(
        `getFeed failed for ${username}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private pushLive(username: string, item: UserNotificationItem): void {
    const sockets = this.connectionRegistry.getSocketsForUser(username);
    for (const client of sockets) {
      wsSendJson(client, 'notification', item);
    }
  }
}
