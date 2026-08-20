import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { type NotificationMessage, withParamHrefs } from '../message';
import { objectPath, userProfilePath } from '../links';

export function buildMessagingMessage(
  event: AnyNotificationEvent,
): NotificationMessage | null {
  switch (event.type) {
    case 'message_direct': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'notification_message_direct',
          params: { author: p.author },
          href: null,
          icon: 'bell',
          actor: p.author,
        },
        { author: userProfilePath(p.author) },
      );
    }
    case 'message_group': {
      const p = event.payload;
      const channelTitle = p.channelTitle?.trim() || p.channelId;
      return {
        key: 'notification_message_group',
        params: { channelTitle },
        href: null,
        icon: 'bell',
        actor: p.author,
      };
    }
    case 'bell_object_message': {
      const p = event.payload;
      const objectName = p.objectName?.trim() || event.objectId || p.channelId;
      const objectHref = event.objectId ? objectPath(event.objectId) : null;
      return withParamHrefs(
        {
          key: 'notification_bell_object_message',
          params: { author: p.author, objectName },
          href: objectHref,
          icon: 'bell',
          actor: p.author,
        },
        {
          author: userProfilePath(p.author),
          ...(objectHref ? { objectName: objectHref } : {}),
        },
      );
    }
    default:
      return null;
  }
}
