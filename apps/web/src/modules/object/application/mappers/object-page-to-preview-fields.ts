import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { FieldEntry } from '@/modules/object-create/domain/object-create.types';

import type {
  ObjectLeftRailBlock,
  ObjectPageViewModel,
  ProjectedGalleryPhotoView,
} from '../../domain/object-page.types';

function pushEntry(
  fields: FieldEntry[],
  counters: Record<string, number>,
  updateType: string,
  value: unknown,
): void {
  const index = counters[updateType] ?? 0;
  counters[updateType] = index + 1;
  fields.push({
    entryKey: `${updateType}:${index}`,
    updateType,
    value,
  });
}

function imageValueFromUrl(url: string | null | undefined): { url: string } | null {
  const trimmed = url?.trim();
  return trimmed && trimmed.length > 0 ? { url: trimmed } : null;
}

function galleryItemValue(photo: ProjectedGalleryPhotoView): unknown {
  const url = photo.url?.trim();
  if (!url) {
    return null;
  }
  if (/^https?:\/\//i.test(url)) {
    return { url };
  }
  return { cid: url };
}

function appendLeftRailBlock(
  block: ObjectLeftRailBlock,
  fields: FieldEntry[],
  counters: Record<string, number>,
): void {
  switch (block.kind) {
    case 'name':
      pushEntry(fields, counters, UPDATE_TYPES.NAME, block.text);
      break;
    case 'title':
      pushEntry(fields, counters, UPDATE_TYPES.TITLE, block.text);
      break;
    case 'description':
      pushEntry(fields, counters, UPDATE_TYPES.DESCRIPTION, block.text);
      break;
    case 'parent':
      pushEntry(fields, counters, UPDATE_TYPES.PARENT, block.objectId);
      break;
    case 'gallery':
      for (const photo of block.photos) {
        const value = galleryItemValue(photo);
        if (value) {
          pushEntry(fields, counters, UPDATE_TYPES.IMAGE_GALLERY_ITEM, value);
        }
      }
      break;
    case 'tags':
      for (const section of block.sections) {
        pushEntry(fields, counters, UPDATE_TYPES.TAG_CATEGORY, section.categoryTitle);
        for (const value of section.values) {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            pushEntry(fields, counters, UPDATE_TYPES.TAG_CATEGORY_ITEM, {
              category: section.categoryTitle,
              value: trimmed,
            });
          }
        }
      }
      break;
    case 'price':
      pushEntry(fields, counters, UPDATE_TYPES.PRICE, block.text);
      break;
    case 'workHours':
      pushEntry(fields, counters, UPDATE_TYPES.WORK_HOURS, block.lines.join('\n'));
      break;
    case 'address':
      pushEntry(fields, counters, UPDATE_TYPES.ADDRESS, block.text);
      break;
    case 'geo':
      if (
        block.latitude !== undefined &&
        block.longitude !== undefined &&
        Number.isFinite(block.latitude) &&
        Number.isFinite(block.longitude)
      ) {
        pushEntry(fields, counters, UPDATE_TYPES.GEO, {
          latitude: String(block.latitude),
          longitude: String(block.longitude),
        });
      }
      break;
    case 'websites':
      for (const entry of block.entries) {
        pushEntry(fields, counters, UPDATE_TYPES.WEBSITE, {
          title: entry.title,
          link: entry.link,
        });
      }
      break;
    case 'phones':
      for (const number of block.numbers) {
        const trimmed = number.trim();
        if (trimmed.length > 0) {
          pushEntry(fields, counters, UPDATE_TYPES.TELEPHONE, trimmed);
        }
      }
      break;
    case 'email':
      pushEntry(fields, counters, UPDATE_TYPES.EMAIL, block.address);
      break;
    case 'identifier':
      for (const row of block.rows) {
        pushEntry(fields, counters, UPDATE_TYPES.IDENTIFIER, {
          type: row.type,
          value: row.value,
        });
      }
      break;
    case 'menuItems':
    case 'rating':
    case 'link':
    case 'walletAddress':
      break;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

function appendRelationRefs(
  model: ObjectPageViewModel,
  fields: FieldEntry[],
  counters: Record<string, number>,
): void {
  for (const card of model.rightRelated) {
    pushEntry(fields, counters, UPDATE_TYPES.IS_RELATED_TO, card.objectId);
  }
  for (const card of model.rightSimilar) {
    pushEntry(fields, counters, UPDATE_TYPES.IS_SIMILAR_TO, card.objectId);
  }
  for (const card of model.rightAddOn) {
    pushEntry(fields, counters, UPDATE_TYPES.ADD_ON, card.objectId);
  }
}

/**
 * Maps projected object page data to create-workspace {@link FieldEntry} rows
 * for preview and semantic completeness panels in edit mode.
 */
export function objectPageModelToPreviewFields(
  model: ObjectPageViewModel,
): FieldEntry[] {
  const fields: FieldEntry[] = [];
  const counters: Record<string, number> = {};

  const avatar = imageValueFromUrl(model.avatarUrl);
  if (avatar) {
    pushEntry(fields, counters, UPDATE_TYPES.IMAGE, avatar);
  }

  const cover = imageValueFromUrl(model.coverImageUrl);
  if (cover) {
    pushEntry(fields, counters, UPDATE_TYPES.IMAGE_BACKGROUND, cover);
  }

  if (!fields.some((f) => f.updateType === UPDATE_TYPES.NAME) && model.title.trim()) {
    pushEntry(fields, counters, UPDATE_TYPES.NAME, model.title);
  }

  if (
    model.subtitleTitle &&
    !fields.some((f) => f.updateType === UPDATE_TYPES.TITLE)
  ) {
    pushEntry(fields, counters, UPDATE_TYPES.TITLE, model.subtitleTitle);
  }

  for (const block of model.leftRailBlocks) {
    appendLeftRailBlock(block, fields, counters);
  }

  if (
    model.descriptionContent?.trim() &&
    !fields.some((f) => f.updateType === UPDATE_TYPES.DESCRIPTION)
  ) {
    pushEntry(fields, counters, UPDATE_TYPES.DESCRIPTION, model.descriptionContent.trim());
  }

  for (const photo of model.previewGallery) {
    const value = galleryItemValue(photo);
    if (value) {
      pushEntry(fields, counters, UPDATE_TYPES.IMAGE_GALLERY_ITEM, value);
    }
  }

  appendRelationRefs(model, fields, counters);

  return fields;
}
