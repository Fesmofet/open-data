'use client';

import { useCallback, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  imageFileFromClipboard,
  parseHttpUrlFromPaste,
} from '@/modules/object-updates/application/image-cid-or-url-paste';

import {
  useIpfsImageUpload,
  type IpfsImageUploadResult,
} from '../../application/use-ipfs-image-upload';

const ZONE_BUTTON_CLASS =
  'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-btn border border-dashed border-border bg-ghost-surface px-6 py-8 text-center transition-colors hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-wait disabled:opacity-60';

const ZONE_BUTTON_COMPACT_CLASS =
  'flex min-h-[8rem] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-btn border border-dashed border-border bg-ghost-surface px-4 py-5 text-center transition-colors hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-wait disabled:opacity-60';

export type IpfsImageDropZoneProps = {
  onUploaded: (result: IpfsImageUploadResult) => void;
  disabled?: boolean;
  compact?: boolean;
  legend?: string;
  hideLegend?: boolean;
  onPointerEnter?: () => void;
  onFocus?: () => void;
};

export function IpfsImageDropZone({
  onUploaded,
  disabled = false,
  compact = false,
  legend,
  hideLegend = false,
  onPointerEnter,
  onFocus,
}: IpfsImageDropZoneProps) {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, importFromUrl, isPending, uploadError } =
    useIpfsImageUpload(onUploaded);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      e.target.value = '';
    },
    [uploadFile],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = imageFileFromClipboard(e.clipboardData);
      if (file) {
        e.preventDefault();
        uploadFile(file);
        return;
      }
      const pastedUrl = parseHttpUrlFromPaste(
        e.clipboardData.getData('text/plain'),
      );
      if (pastedUrl) {
        e.preventDefault();
        importFromUrl(pastedUrl);
      }
    },
    [importFromUrl, uploadFile],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const zoneLegend = legend ?? t('object_create_image_zone_title');
  const baseClass = compact ? ZONE_BUTTON_COMPACT_CLASS : ZONE_BUTTON_CLASS;
  const zoneClass = isDragOver
    ? `${baseClass} border-accent/50 bg-accent/5`
    : baseClass;

  return (
    <fieldset
      className="space-y-2 text-body-sm"
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
    >
      {!hideLegend ? (
        <legend className="sr-only">{zoneLegend}</legend>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={onFileInputChange}
      />

      <button
        type="button"
        aria-label={zoneLegend}
        disabled={disabled || isPending}
        className={zoneClass}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={openFilePicker}
      >
        {isPending ? (
          <p className="text-body-sm text-muted">
            {t('object_create_image_uploading')}
          </p>
        ) : compact ? (
          <>
            <p className="text-body-sm font-weight-label text-fg">
              {t('object_create_image_click_upload')}
            </p>
            <p className="text-caption text-muted">
              {t('object_create_image_drag_drop')}
            </p>
          </>
        ) : (
          <>
            <p className="text-body-sm font-weight-label text-fg">
              {t('object_create_image_zone_title')}
            </p>
            <p className="text-body-sm text-muted">
              {t('object_create_image_drag_drop')}
            </p>
            <p className="text-body-sm text-muted">
              {t('object_create_image_click_upload')}
            </p>
            <p className="text-caption text-muted">
              {t('object_create_image_paste_hint')}
            </p>
          </>
        )}
      </button>

      {uploadError ? (
        <p className="text-caption text-error" role="alert">
          {uploadError}
        </p>
      ) : null}
    </fieldset>
  );
}
