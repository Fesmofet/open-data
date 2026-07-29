import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';

export interface RecipientStrategy {
  supports(type: AnyNotificationEvent['type']): boolean;
  resolveRecipients(event: AnyNotificationEvent): Promise<string[]>;
}
