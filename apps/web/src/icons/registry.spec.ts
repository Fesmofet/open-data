import { OBJECT_TYPE_GROUPS } from '@/modules/object-create/domain/object-type-display';
import { GROUP_ICON_NAMES } from '@/modules/object-create/presentation/components/object-type-group-icons';
import { NOTIFICATION_ICON_BY_TYPE } from '@/modules/notifications/domain/notification-icon-map';

import { customIconPack } from './packs/custom';
import { lucideIconPack } from './packs/lucide';
import { ICON_REGISTRY } from './registry';

const CUSTOM_ONLY_ICON_NAMES = new Set([
  'brand-facebook',
  'brand-x',
  'hive-savings-shield',
  'hbd-savings-shield',
  'wallet-power-lightning',
  'reward-flashlight',
  'weight-scale',
  'dimensions',
  'wallet-savings-shield',
]);

describe('ICON_REGISTRY', () => {
  it('every registered name resolves to a renderable component (TC-010)', () => {
    for (const component of Object.values(ICON_REGISTRY)) {
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    }
  });

  it('custom override keys exist in the lucide base pack; additive keys are allowlisted (TC-011)', () => {
    for (const key of Object.keys(customIconPack)) {
      if (CUSTOM_ONLY_ICON_NAMES.has(key)) {
        continue;
      }
      expect(Object.hasOwn(lucideIconPack, key)).toBe(true);
    }
  });

  it('object type group icon map is complete (TC-021)', () => {
    const groupIds = [
      ...OBJECT_TYPE_GROUPS.map((group) => group.id),
      'other',
    ] as const;

    for (const groupId of groupIds) {
      const iconName = GROUP_ICON_NAMES[groupId];
      expect(ICON_REGISTRY[iconName]).toBeDefined();
    }
  });

  it('notification icon map is complete (TC-021)', () => {
    for (const iconName of Object.values(NOTIFICATION_ICON_BY_TYPE)) {
      expect(ICON_REGISTRY[iconName]).toBeDefined();
    }
  });
});
