import type { Area } from 'react-easy-crop';

export type ImageEditorConfig = {
  /** Fixed crop aspect (e.g. 1 for square). Omit for natural image aspect. */
  aspectRatio?: number;
  maxOutputPx: number;
  backgroundColor: string;
};

export type ImageEditorExportParams = {
  imageSrc: string;
  pixelCrop: Area;
  rotation: number;
  flipH: boolean;
  flipV?: boolean;
  config: ImageEditorConfig;
};
