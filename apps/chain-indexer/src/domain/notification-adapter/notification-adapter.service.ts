import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { NOTIFICATION_EVENT } from './events/notification-domain-events';
import { ObjectNameResolverService } from './object-name-resolver.service';
import {
  INotificationPublisher,
  NOTIFICATION_PUBLISHER,
} from './notification-publisher.interface';

@Injectable()
export class NotificationAdapterService {
  private readonly logger = new Logger(NotificationAdapterService.name);

  constructor(
    @Inject(NOTIFICATION_PUBLISHER)
    private readonly publisher: INotificationPublisher,
    private readonly objectNameResolver: ObjectNameResolverService,
  ) {}

  @OnEvent(NOTIFICATION_EVENT)
  async onNotification(event: AnyNotificationEvent): Promise<void> {
    const enriched = await this.enrich(event);
    await this.publish(enriched);
  }

  private async enrich(event: AnyNotificationEvent): Promise<AnyNotificationEvent> {
    switch (event.type) {
      case 'object_update': {
        if (!event.objectId || event.payload.objectName) {
          return event;
        }
        const objectName = await this.objectNameResolver.resolve(event.objectId);
        if (!objectName) {
          return event;
        }
        return {
          ...event,
          payload: { ...event.payload, objectName },
        };
      }
      case 'object_update_reject': {
        if (!event.objectId || event.payload.objectName) {
          return event;
        }
        const objectName = await this.objectNameResolver.resolve(event.objectId);
        if (!objectName) {
          return event;
        }
        return {
          ...event,
          payload: { ...event.payload, objectName },
        };
      }
      case 'object_status_change': {
        if (!event.objectId || event.payload.objectName) {
          return event;
        }
        const objectName = await this.objectNameResolver.resolve(event.objectId);
        if (!objectName) {
          return event;
        }
        return {
          ...event,
          payload: { ...event.payload, objectName },
        };
      }
      case 'update_vote_cast': {
        if (!event.objectId || event.payload.objectName) {
          return event;
        }
        const objectName = await this.objectNameResolver.resolve(event.objectId);
        if (!objectName) {
          return event;
        }
        return {
          ...event,
          payload: { ...event.payload, objectName },
        };
      }
      default:
        return event;
    }
  }

  private async publish(event: AnyNotificationEvent): Promise<void> {
    try {
      await this.publisher.publish(event);
    } catch (err) {
      this.logger.error(
        `Failed to publish notification ${event.type}: ${(err as Error).message}`,
      );
    }
  }
}
