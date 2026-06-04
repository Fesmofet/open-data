'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { normalizeImageCidOrUrlFormValue } from '../../application/image-form-value';
import { ImageCidOrUrlForm } from './image-cid-or-url-form';

export type ImageGalleryItemFormProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  /** Existing gallery album names on the object. */
  albumNames?: readonly string[];
  /** When set, album field is read-only (add image inside album view). */
  lockAlbum?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function ImageGalleryItemForm({
  value,
  onChange,
  albumNames = [],
  lockAlbum = false,
}: ImageGalleryItemFormProps) {
  const { t } = useI18n();
  const obj = asRecord(value);
  const album = typeof obj.album === 'string' ? obj.album : '';

  const imageValue = {
    url: typeof obj.url === 'string' ? obj.url : undefined,
    cid: typeof obj.cid === 'string' ? obj.cid : undefined,
  };

  const objRef = useRef(obj);
  objRef.current = obj;

  const patchValue = useCallback(
    (patch: Record<string, unknown>) => {
      onChange({ ...objRef.current, ...patch });
    },
    [onChange],
  );

  const handleImageChange = useCallback(
    (imgValue: unknown) => {
      const img = asRecord(imgValue);
      const image = normalizeImageCidOrUrlFormValue({
        cid: img.cid,
        url: img.url,
      });
      const next = { ...objRef.current };
      delete next.cid;
      delete next.url;
      onChange({ ...next, ...image });
    },
    [onChange],
  );

  useEffect(() => {
    if (lockAlbum || albumNames.length === 0) {
      return;
    }
    const current =
      typeof objRef.current.album === 'string' ? objRef.current.album.trim() : '';
    if (!current && albumNames[0]) {
      patchValue({ album: albumNames[0] });
    }
  }, [lockAlbum, albumNames, patchValue]);

  if (albumNames.length === 0) {
    return (
      <p className="text-body-sm text-muted" role="status">
        {t('object_edit_gallery_item_no_albums')}
      </p>
    );
  }

  const albumField = lockAlbum ? (
    <label className="block text-body-sm">
      <span className="font-weight-label text-fg">{t('album')}</span>
      <input
        type="text"
        readOnly
        className="mt-2 w-full rounded-btn border border-border bg-surface/60 px-3 py-2 text-fg"
        value={album}
      />
    </label>
  ) : (
    <label className="block text-body-sm">
      <span className="font-weight-label text-fg">{t('album')}</span>
      <select
        className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
        value={album && albumNames.includes(album) ? album : albumNames[0] ?? ''}
        onChange={(e) => patchValue({ album: e.target.value })}
      >
        {albumNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-3">
      {albumField}
      <ImageCidOrUrlForm
        value={imageValue}
        onChange={handleImageChange}
        label={t('object_create_image_zone_title')}
      />
    </div>
  );
}
