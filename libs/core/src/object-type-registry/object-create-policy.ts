import { OBJECT_TYPE_REGISTRY } from './object-type-registry';
import { UPDATE_TYPES } from '../update-registry/update-types';

/** Product baseline: always required when supported by the object type (not a chain requirement). */
export const OBJECT_CREATE_REQUIRED_UPDATE_TYPES: readonly string[] = [
  UPDATE_TYPES.NAME,
  UPDATE_TYPES.DESCRIPTION,
  UPDATE_TYPES.IMAGE,
];

/** Extra product-baseline required updates per object type (when supported). */
export const OBJECT_CREATE_REQUIRED_BY_TYPE: Readonly<
  Record<string, readonly string[]>
> = {
  recipe: [UPDATE_TYPES.INGREDIENTS],
  skill: [UPDATE_TYPES.SKILL_CONTENT],
};

/**
 * Returns product-baseline required update types for object create,
 * filtered to those supported by the object type.
 */
export function getRequiredObjectCreateUpdates(objectType: string): string[] {
  const def = OBJECT_TYPE_REGISTRY[objectType];
  if (!def) {
    return [];
  }
  const supported = new Set(def.supported_updates);
  const typeSpecific = OBJECT_CREATE_REQUIRED_BY_TYPE[objectType] ?? [];
  const required = [
    ...OBJECT_CREATE_REQUIRED_UPDATE_TYPES.filter((t) => supported.has(t)),
    ...typeSpecific.filter((t) => supported.has(t)),
  ];
  return [...new Set(required)];
}
