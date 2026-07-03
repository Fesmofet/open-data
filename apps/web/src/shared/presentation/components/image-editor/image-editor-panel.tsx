'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, {
  type Area,
  type MediaSize,
  type Point,
  type Size,
} from 'react-easy-crop';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  computeFitCropAndZoom,
  exportEditedImageBlob,
  flipImageHorizontally,
  resolveEditorAspect,
} from './image-editor-canvas';
import type { ImageEditorConfig } from './image-editor.types';

import 'react-easy-crop/react-easy-crop.css';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

export type ImageEditorPanelProps = {
  imageSrc: string;
  config: ImageEditorConfig;
  onSave: (file: File) => void;
  onCancel: () => void;
  isSaving?: boolean;
};

export function ImageEditorPanel({
  imageSrc,
  config,
  onSave,
  onCancel,
  isSaving = false,
}: ImageEditorPanelProps) {
  const { t } = useI18n();
  const [workingSrc, setWorkingSrc] = useState(imageSrc);
  const flippedUrlRef = useRef<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(config.aspectRatio ?? 4 / 3);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const shouldFitAfterReloadRef = useRef(false);

  useEffect(() => {
    setWorkingSrc(imageSrc);
    if (flippedUrlRef.current) {
      URL.revokeObjectURL(flippedUrlRef.current);
      flippedUrlRef.current = null;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setMediaSize(null);
    setCropSize(null);
    setCroppedAreaPixels(null);
  }, [imageSrc]);

  useEffect(() => {
    return () => {
      if (flippedUrlRef.current) {
        URL.revokeObjectURL(flippedUrlRef.current);
      }
    };
  }, []);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onCropAreaChange = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onMediaLoaded = useCallback(
    (media: MediaSize) => {
      setMediaSize(media);
      setAspect(resolveEditorAspect(config, media.naturalWidth, media.naturalHeight));
      if (shouldFitAfterReloadRef.current && cropSize) {
        shouldFitAfterReloadRef.current = false;
        const { crop: nextCrop, zoom: nextZoom } = computeFitCropAndZoom(
          media,
          cropSize,
          rotation,
          MIN_ZOOM,
          MAX_ZOOM,
        );
        setCrop(nextCrop);
        setZoom(nextZoom);
      }
    },
    [config, cropSize, rotation],
  );

  const applyFit = useCallback(
    (size: MediaSize | null, area: Size | null, rot: number) => {
      if (!size || !area) {
        return;
      }
      const { crop: nextCrop, zoom: nextZoom } = computeFitCropAndZoom(
        size,
        area,
        rot,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      setCrop(nextCrop);
      setZoom(nextZoom);
    },
    [],
  );

  const handleFit = useCallback(() => {
    applyFit(mediaSize, cropSize, rotation);
  }, [applyFit, cropSize, mediaSize, rotation]);

  useEffect(() => {
    if (!shouldFitAfterReloadRef.current || !mediaSize || !cropSize) {
      return;
    }
    shouldFitAfterReloadRef.current = false;
    applyFit(mediaSize, cropSize, rotation);
  }, [applyFit, cropSize, mediaSize, rotation]);

  const handleRotate = useCallback(() => {
    if (!mediaSize || !cropSize) {
      return;
    }
    const next = (rotation + 90) % 360;
    const { crop: nextCrop, zoom: nextZoom } = computeFitCropAndZoom(
      mediaSize,
      cropSize,
      next,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    setRotation(next);
    setCrop(nextCrop);
    setZoom(nextZoom);
  }, [cropSize, mediaSize, rotation]);

  const handleMirror = useCallback(async () => {
    if (isFlipping) {
      return;
    }
    setExportError(null);
    setIsFlipping(true);
    try {
      const flipped = await flipImageHorizontally(workingSrc);
      if (flippedUrlRef.current) {
        URL.revokeObjectURL(flippedUrlRef.current);
      }
      flippedUrlRef.current = flipped.url;
      setWorkingSrc(flipped.url);
      setCroppedAreaPixels(null);
      setRotation(0);
      shouldFitAfterReloadRef.current = true;
    } catch {
      setExportError(t('object_create_image_upload_error'));
    } finally {
      setIsFlipping(false);
    }
  }, [isFlipping, t, workingSrc]);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels || isSaving || isExporting) {
      return;
    }
    setExportError(null);
    setIsExporting(true);
    try {
      const blob = await exportEditedImageBlob({
        imageSrc: workingSrc,
        pixelCrop: croppedAreaPixels,
        rotation,
        flipH: false,
        config,
      });
      onSave(new File([blob], 'image.webp', { type: 'image/webp' }));
    } catch {
      setExportError(t('object_create_image_upload_error'));
    } finally {
      setIsExporting(false);
    }
  }, [
    config,
    croppedAreaPixels,
    isExporting,
    isSaving,
    onSave,
    rotation,
    t,
    workingSrc,
  ]);

  const busy = isSaving || isExporting || isFlipping;

  return (
    <div className="space-y-3">
      <div className="relative h-64 w-full overflow-hidden rounded-btn border border-border bg-ghost-surface">
        <Cropper
          image={workingSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onCropAreaChange={onCropAreaChange}
          onCropSizeChange={setCropSize}
          onMediaLoaded={onMediaLoaded}
          style={{}}
          classes={{}}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 text-body-sm text-fg">
          <span className="shrink-0 font-weight-label">{t('image_editor_zoom')}</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={busy}
            className="min-w-0 flex-1"
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className="rounded-btn border border-border bg-bg px-3 py-1.5 text-body-sm text-fg hover:bg-surface disabled:opacity-50"
            onClick={handleFit}
          >
            {t('image_editor_fit')}
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-btn border border-border bg-bg px-3 py-1.5 text-body-sm text-fg hover:bg-surface disabled:opacity-50"
            onClick={handleRotate}
          >
            {t('image_editor_rotate')}
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-btn border border-border bg-bg px-3 py-1.5 text-body-sm text-fg hover:bg-surface disabled:opacity-50"
            onClick={() => void handleMirror()}
          >
            {t('image_editor_mirror')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-btn border border-border bg-bg px-4 py-2 text-body-sm text-fg hover:bg-surface disabled:opacity-50"
          onClick={onCancel}
        >
          {t('image_editor_cancel')}
        </button>
        <button
          type="button"
          disabled={busy || !croppedAreaPixels}
          className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-on-accent hover:bg-accent/90 disabled:opacity-50"
          onClick={() => void handleSave()}
        >
          {busy ? t('image_editor_processing') : t('image_editor_save')}
        </button>
      </div>

      {exportError ? (
        <p className="text-caption text-error" role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
