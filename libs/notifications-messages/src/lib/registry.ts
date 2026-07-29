import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { buildBellMessage } from './builders/bell';
import { buildObjectMessage } from './builders/objects';
import { buildServiceMessage } from './builders/service';
import { buildSocialMessage } from './builders/social';
import { buildWalletMessage } from './builders/wallet';
import { GENERIC_NOTIFICATION_KEY, type NotificationMessage } from './message';

const BUILDERS = [
  buildSocialMessage,
  buildBellMessage,
  buildWalletMessage,
  buildObjectMessage,
  buildServiceMessage,
] as const;

export function buildNotificationMessage(
  event: AnyNotificationEvent,
): NotificationMessage {
  for (const build of BUILDERS) {
    const message = build(event);
    if (message) {
      return message;
    }
  }
  return {
    key: GENERIC_NOTIFICATION_KEY,
    params: {},
    href: null,
    icon: 'generic',
    actor: event.actor,
  };
}
