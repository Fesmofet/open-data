import {
  resolveEditGroup,
  resolveEditModeUpdateTypes,
  type EditFieldGroupId,
} from '@opden-data-layer/core/update-registry';

import type { EditModeLeftRailBlockId } from '@/modules/object/domain/object-left-rail-order';

import {
  BLOCK_KIND_TO_UPDATE_TYPES,
  type ObjectLeftRailBlockKind,
} from './block-update-type-map';

function buildUpdateTypeToBlockKind(): ReadonlyMap<string, ObjectLeftRailBlockKind> {
  const map = new Map<string, ObjectLeftRailBlockKind>();
  for (const [kind, types] of Object.entries(BLOCK_KIND_TO_UPDATE_TYPES)) {
    for (const updateType of types) {
      if (!map.has(updateType)) {
        map.set(updateType, kind as ObjectLeftRailBlockKind);
      }
    }
  }
  return map;
}

const UPDATE_TYPE_TO_BLOCK_KIND = buildUpdateTypeToBlockKind();

/**
 * Edit-mode left-rail block order derived from core edit-field-groups catalog.
 * Unmapped update types (no left-rail block yet) are skipped.
 */
export function resolveEditModeBlockKinds(
  objectType = '',
): readonly EditModeLeftRailBlockId[] {
  const updateOrder = resolveEditModeUpdateTypes(objectType);
  const seen = new Set<ObjectLeftRailBlockKind>();
  const blockKinds: EditModeLeftRailBlockId[] = [];

  for (const updateType of updateOrder) {
    const kind = UPDATE_TYPE_TO_BLOCK_KIND.get(updateType);
    if (!kind || seen.has(kind)) {
      continue;
    }
    seen.add(kind);
    blockKinds.push(kind);
  }

  return blockKinds;
}

/** Resolves edit group for a left-rail block via its primary update_type. */
export function resolveEditGroupForBlockKind(
  kind: ObjectLeftRailBlockKind,
  objectType = '',
): EditFieldGroupId | undefined {
  const primaryType = BLOCK_KIND_TO_UPDATE_TYPES[kind][0];
  return resolveEditGroup(primaryType, objectType);
}
