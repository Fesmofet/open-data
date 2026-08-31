import type { IconName } from '@/icons';

import type { NotificationIconType } from './format-notification';

export const NOTIFICATION_ICON_BY_TYPE: Record<NotificationIconType, IconName> = {
  follow: 'users',
  vote: 'shopping-bag',
  reply: 'bell',
  wallet: 'bell',
  object: 'bell',
  bell: 'bell',
  generic: 'bell',
};
