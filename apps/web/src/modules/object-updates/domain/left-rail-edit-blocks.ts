import {
  EDIT_MODE_LEFT_RAIL_BLOCK_ORDER,
  type EditModeLeftRailBlockId,
} from '@/modules/object/domain/object-left-rail-order';
import { OBJECT_LEFT_RAIL_BLOCK_LABEL } from '@/modules/object/domain/object-update-labels';
import type { ObjectLeftRailBlock } from '@/modules/object/domain/object-page.types';

import {
  BLOCK_KIND_TO_UPDATE_TYPES,
  type ObjectLeftRailBlockKind,
} from './block-update-type-map';

function isEditableKind(
  kind: EditModeLeftRailBlockId,
  supported: Set<string>,
): boolean {
  const candidates = BLOCK_KIND_TO_UPDATE_TYPES[kind as ObjectLeftRailBlockKind];
  return candidates.some((t) => supported.has(t));
}

function createEmptyBlock(kind: ObjectLeftRailBlockKind): ObjectLeftRailBlock {
  const headingLabel = OBJECT_LEFT_RAIL_BLOCK_LABEL[kind] ?? kind;
  switch (kind) {
    case 'name':
      return { kind: 'name', headingLabel, text: '' };
    case 'title':
      return { kind: 'title', headingLabel, text: '' };
    case 'menuItems':
      return { kind: 'menuItems', headingLabel, items: [] };
    case 'image':
      return { kind: 'image', headingLabel, url: null };
    case 'imageBackground':
      return { kind: 'imageBackground', headingLabel, url: null };
    case 'parent':
      return {
        kind: 'parent',
        headingLabel,
        objectId: '',
        name: '',
        imageUrl: null,
      };
    case 'description':
      return { kind: 'description', headingLabel, text: '' };
    case 'button':
      return { kind: 'button', headingLabel, items: [] };
    case 'rating':
      return { kind: 'rating', headingLabel, aspects: [] };
    case 'tags':
      return { kind: 'tags', headingLabel, sections: [] };
    case 'gallery':
      return { kind: 'gallery', headingLabel, photos: [] };
    case 'price':
      return { kind: 'price', headingLabel, text: '' };
    case 'workHours':
      return { kind: 'workHours', headingLabel, lines: [] };
    case 'address':
      return { kind: 'address', headingLabel, text: '' };
    case 'geo':
      return { kind: 'geo', headingLabel };
    case 'websites':
      return { kind: 'websites', headingLabel, entries: [] };
    case 'link':
      return { kind: 'link', headingLabel, items: [] };
    case 'phones':
      return { kind: 'phones', headingLabel, entries: [] };
    case 'email':
      return { kind: 'email', headingLabel, address: '' };
    case 'walletAddress':
      return { kind: 'walletAddress', headingLabel, items: [] };
    case 'identifier':
      return { kind: 'identifier', headingLabel, rows: [] };
    case 'status':
      return { kind: 'status', headingLabel };
    case 'compareAtPrice':
      return { kind: 'compareAtPrice', headingLabel };
    case 'saleEvent':
      return { kind: 'saleEvent', headingLabel };
    case 'size':
      return { kind: 'size', headingLabel };
    case 'brand':
      return { kind: 'brand', headingLabel, items: [] };
    case 'manufacturer':
      return { kind: 'manufacturer', headingLabel, items: [] };
    case 'merchant':
      return { kind: 'merchant', headingLabel, items: [] };
    case 'featureList':
      return { kind: 'featureList', headingLabel };
    case 'category':
      return { kind: 'category', headingLabel };
    case 'calories':
      return { kind: 'calories', headingLabel };
    case 'cookTime':
      return { kind: 'cookTime', headingLabel };
    case 'ingredients':
      return { kind: 'ingredients', headingLabel };
    case 'nutrition':
      return { kind: 'nutrition', headingLabel };
    case 'author':
      return { kind: 'author', headingLabel, items: [] };
    case 'publisher':
      return { kind: 'publisher', headingLabel, items: [] };
    case 'datePublished':
      return { kind: 'datePublished', headingLabel };
    case 'inLanguage':
      return { kind: 'inLanguage', headingLabel };
    case 'typicalAgeRange':
      return { kind: 'typicalAgeRange', headingLabel };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * In edit mode, show every supported left-rail slot (heading + add) even when empty.
 * View-mode blocks with content are reused; missing slots get empty placeholders.
 */
export function mergeLeftRailBlocksForEditMode(
  viewBlocks: ObjectLeftRailBlock[],
  supportedUpdateTypes: readonly string[],
): ObjectLeftRailBlock[] {
  const supported = new Set(supportedUpdateTypes);
  const byKind = new Map<ObjectLeftRailBlock['kind'], ObjectLeftRailBlock>();
  for (const block of viewBlocks) {
    byKind.set(block.kind, block);
  }

  const merged: ObjectLeftRailBlock[] = [];

  for (const slot of EDIT_MODE_LEFT_RAIL_BLOCK_ORDER) {
    if (!isEditableKind(slot, supported)) {
      continue;
    }

    const kind = slot as ObjectLeftRailBlockKind;
    const existing = byKind.get(kind);
    merged.push(existing ?? createEmptyBlock(kind));
  }

  return merged;
}
