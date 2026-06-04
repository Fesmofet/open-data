'use client';

import { useCallback, useState, useTransition } from 'react';

import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import {
  extractCidFromContentGatewayUrl,
  imageContentUrlForCid,
} from '@/config/ipfs-content-url';
import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  type UploadImageToIpfsErrorCode,
  uploadImageToIpfs,
} from '@/modules/object-create/infrastructure/actions/upload-image.action';
import { uploadImageFromUrl } from '@/modules/object-create/infrastructure/actions/upload-image-from-url.action';

function messageForImageUploadError(
  code: UploadImageToIpfsErrorCode | string | undefined,
  t: (key: string) => string,
): string {
  if (code === 'service_unavailable') {
    const specific = t('object_create_image_service_unavailable');
    if (specific !== 'object_create_image_service_unavailable') {
      return specific;
    }
  }
  return t('object_create_image_upload_error');
}

export type IpfsImageUploadResult = {
  cid: string;
  previewUrl: string;
};

export function useIpfsImageUpload(
  onUploaded: (result: IpfsImageUploadResult) => void,
) {
  const { t } = useI18n();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadFile = useCallback(
    (file: File) => {
      setUploadError(null);
      const formData = new FormData();
      formData.append('file', file);
      startTransition(async () => {
        try {
          const result = await uploadImageToIpfs(formData);
          if ('error' in result) {
            setUploadError(messageForImageUploadError(result.error, t));
            return;
          }
          onUploaded({ cid: result.cid, previewUrl: result.previewUrl });
        } catch {
          setUploadError(t('object_create_image_upload_error'));
        }
      });
    },
    [onUploaded, t],
  );

  const importFromUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      setUploadError(null);

      const gatewayCid = extractCidFromContentGatewayUrl(trimmed);
      if (gatewayCid && contentBaseUrl) {
        onUploaded({
          cid: gatewayCid,
          previewUrl: imageContentUrlForCid(contentBaseUrl, gatewayCid),
        });
        return;
      }

      startTransition(async () => {
        try {
          const result = await uploadImageFromUrl(trimmed);
          if ('error' in result) {
            setUploadError(messageForImageUploadError(result.error, t));
            return;
          }
          onUploaded({ cid: result.cid, previewUrl: result.previewUrl });
        } catch {
          setUploadError(t('object_create_image_upload_error'));
        }
      });
    },
    [contentBaseUrl, onUploaded, t],
  );

  return {
    uploadFile,
    importFromUrl,
    isPending,
    uploadError,
    clearError: () => setUploadError(null),
  };
}
