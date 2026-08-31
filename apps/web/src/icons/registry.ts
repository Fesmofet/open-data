import { customIconPack } from './packs/custom';
import { lucideIconPack } from './packs/lucide';
import type { IconPack } from './types';

export function composeIconRegistry<B extends IconPack, O extends IconPack>(
  base: B,
  overrides: O,
): B & O {
  return { ...base, ...overrides };
}

export const ICON_REGISTRY = composeIconRegistry(lucideIconPack, customIconPack);

export type IconName = keyof typeof ICON_REGISTRY;
