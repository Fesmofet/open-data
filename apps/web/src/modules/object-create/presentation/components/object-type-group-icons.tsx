import { Icon, type IconName } from '@/icons';

import type { ObjectTypeSelectorGroupId } from '../../domain/object-type-display';

export const GROUP_ICON_NAMES: Record<ObjectTypeSelectorGroupId, IconName> = {
  popular: 'star',
  content: 'file-text',
  social: 'users',
  commerce: 'shopping-cart',
  maps: 'map-pin',
  web: 'globe',
  other: 'layout-grid',
};

export function ObjectTypeGroupIcon({
  groupId,
  className,
}: {
  groupId: ObjectTypeSelectorGroupId;
  className?: string;
}) {
  return <Icon name={GROUP_ICON_NAMES[groupId]} size="md" className={className} />;
}
