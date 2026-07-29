import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';

/** In-process event consumed by NotificationAdapterService. */
export const NOTIFICATION_EVENT = 'notification.event' as const;

/** @deprecated Use {@link NOTIFICATION_EVENT} */
export const VOTE_CAST_NOTIFICATION_EVENT = NOTIFICATION_EVENT;
/** @deprecated Use {@link NOTIFICATION_EVENT} */
export const FOLLOW_NOTIFICATION_EVENT = NOTIFICATION_EVENT;
/** @deprecated Use {@link NOTIFICATION_EVENT} */
export const OBJECT_CREATED_NOTIFICATION_EVENT = NOTIFICATION_EVENT;
/** @deprecated Use {@link NOTIFICATION_EVENT} */
export const TRX_PROCESSED_NOTIFICATION_EVENT = NOTIFICATION_EVENT;
/** @deprecated Use {@link NOTIFICATION_EVENT} */
export const BATCH_IMPORT_COMPLETED_NOTIFICATION_EVENT = NOTIFICATION_EVENT;

export type NotificationDomainEvent = AnyNotificationEvent;
