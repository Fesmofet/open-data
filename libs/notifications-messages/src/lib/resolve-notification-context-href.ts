import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';

import { inboxPath } from './links';
import type { NotificationMessage } from './message';

function readChannelId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  if (!('channelId' in payload)) {
    return null;
  }
  const channelId = (payload as { channelId?: unknown }).channelId;
  return typeof channelId === 'string' && channelId.trim().length > 0
    ? channelId
    : null;
}

/** Primary navigation target for web overlay and Telegram "Go to website". */
export function resolveNotificationContextHref(
  event: AnyNotificationEvent,
  message: NotificationMessage,
  recipientUsername?: string,
): string | null {
  const recipient = recipientUsername?.trim();
  if (
    recipient &&
    (event.type === 'message_direct' || event.type === 'message_group')
  ) {
    const channelId = readChannelId(event.payload);
    if (channelId) {
      return inboxPath(recipient, channelId);
    }
  }
  return message.href;
}
