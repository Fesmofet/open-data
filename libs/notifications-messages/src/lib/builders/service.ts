import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { GENERIC_NOTIFICATION_KEY, type NotificationMessage } from '../message';

export function buildServiceMessage(
  event: AnyNotificationEvent,
): NotificationMessage | null {
  switch (event.type) {
    case 'batch_import_completed':
      return {
        key: 'import_update',
        params: { cid: event.payload.cid },
        href: null,
        icon: 'generic',
        actor: event.actor,
      };
    case 'trx_processed':
      return {
        key: GENERIC_NOTIFICATION_KEY,
        params: {},
        href: null,
        icon: 'generic',
        actor: null,
      };
    default:
      return null;
  }
}
