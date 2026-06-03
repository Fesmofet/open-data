'use client';

import { useCallback, useState } from 'react';

import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { imageContentUrlForCid } from '@/config/ipfs-content-url';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { IpfsImageDropZone } from '@/shared/presentation';
import { useIpfsImageUpload } from '@/shared/application';

import { useGlobalImagePaste } from '@/modules/object-updates/application/use-global-image-paste';

export type ImageCidOrUrlFormProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  label?: string;
  hideLegend?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function previewUrlFromValue(
  value: unknown,
  contentBaseUrl: string,
): string | null {
  if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
    return value.trim();
  }
  const o = asRecord(value);
  const url = typeof o.url === 'string' ? o.url.trim() : '';
  if (url && /^https?:\/\//i.test(url)) {
    return url;
  }
  const cid = typeof o.cid === 'string' ? o.cid.trim() : '';
  if (cid && contentBaseUrl) {
    return imageContentUrlForCid(contentBaseUrl, cid);
  }
  return null;
}

const ACTION_LINK_CLASS =
  'text-body-sm text-accent hover:underline disabled:pointer-events-none disabled:opacity-50';

export function ImageCidOrUrlForm({
  value,
  onChange,
  label,
  hideLegend = false,
}: ImageCidOrUrlFormProps) {
  const { t } = useI18n();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );

  const previewUrl =
    localPreviewUrl ?? previewUrlFromValue(value, contentBaseUrl);
  const hasImage = Boolean(previewUrl);

  const onUploaded = useCallback(
    (result: { cid: string; previewUrl: string }) => {
      setLocalPreviewUrl(result.previewUrl);
      setCopyFeedback('idle');
      onChange({ cid: result.cid });
    },
    [onChange],
  );

  const { uploadFile, importFromUrl, isPending } = useIpfsImageUpload(onUploaded);

  const { markActive } = useGlobalImagePaste({
    uploadFile,
    importImageFromUrl: importFromUrl,
    hasImage,
  });

  const clearImage = useCallback(() => {
    setLocalPreviewUrl(null);
    setCopyFeedback('idle');
    onChange({});
  }, [onChange]);

  const copyDisplayUrl = useCallback(async () => {
    if (!previewUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopyFeedback('copied');
    } catch {
      setCopyFeedback('failed');
    }
  }, [previewUrl]);

  const zoneLegend = label ?? t('object_create_image_zone_title');

  return (
    <fieldset
      className="space-y-3 text-body-sm"
      onPointerEnter={markActive}
      onFocus={markActive}
    >
      {label && !hideLegend ? (
        <legend className="font-weight-label text-fg">{label}</legend>
      ) : hideLegend ? (
        <legend className="sr-only">{zoneLegend}</legend>
      ) : null}

      {hasImage ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-btn border border-border bg-ghost-surface">
            <img
              src={previewUrl ?? ''}
              alt=""
              className="max-h-64 min-h-[14rem] w-full object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              className={ACTION_LINK_CLASS}
              disabled={isPending}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) {
                    uploadFile(file);
                  }
                };
                input.click();
              }}
            >
              {t('object_create_image_change')}
            </button>
            <button
              type="button"
              className={ACTION_LINK_CLASS}
              disabled={!previewUrl}
              onClick={() => void copyDisplayUrl()}
            >
              {t('object_create_image_copy_url')}
            </button>
            <button
              type="button"
              className={ACTION_LINK_CLASS}
              onClick={clearImage}
            >
              {t('object_create_image_remove')}
            </button>
          </div>
          {copyFeedback === 'copied' ? (
            <p className="text-caption text-muted" role="status">
              {t('object_create_image_url_copied')}
            </p>
          ) : null}
          {copyFeedback === 'failed' ? (
            <p className="text-caption text-error" role="alert">
              {t('object_create_image_copy_failed')}
            </p>
          ) : null}
        </div>
      ) : (
        <IpfsImageDropZone
          onUploaded={onUploaded}
          disabled={isPending}
          legend={zoneLegend}
          hideLegend
          onPointerEnter={markActive}
          onFocus={markActive}
        />
      )}
    </fieldset>
  );
}
