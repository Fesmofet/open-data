import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { ImageEditorConfig } from '@/shared/presentation/components/image-editor/image-editor.types';

const DEFAULT_BACKGROUND = '#e8e8e8';

const AVATAR_CONFIG: ImageEditorConfig = {
  aspectRatio: 1,
  maxOutputPx: 1024,
  backgroundColor: DEFAULT_BACKGROUND,
};

const COVER_CONFIG: ImageEditorConfig = {
  maxOutputPx: 1920,
  backgroundColor: DEFAULT_BACKGROUND,
};

const GALLERY_CONFIG: ImageEditorConfig = {
  maxOutputPx: 1920,
  backgroundColor: DEFAULT_BACKGROUND,
};

export function imageEditorConfigForUpdateType(
  updateType: string,
): ImageEditorConfig | undefined {
  switch (updateType) {
    case UPDATE_TYPES.IMAGE:
      return AVATAR_CONFIG;
    case UPDATE_TYPES.IMAGE_BACKGROUND:
      return COVER_CONFIG;
    case UPDATE_TYPES.IMAGE_GALLERY_ITEM:
      return GALLERY_CONFIG;
    default:
      return undefined;
  }
}
