'use server';

import { getIpfsGatewayServerBaseUrl } from '@/config/get-ipfs-gateway-server-base-url';
import { getIpfsContentBaseUrl } from '@/config/get-ipfs-content-base-url';
import { imageContentUrlForCid } from '@/config/ipfs-content-url';
import { getBearerAccessToken } from '@/shared/infrastructure/auth/get-bearer-access-token.server';
import { safeFetch } from '@/shared/infrastructure/http/safe-fetch.server';

export type UploadImageToIpfsErrorCode =
  | 'unauthorized'
  | 'service_unavailable'
  | 'upload_failed';

export type UploadImageToIpfsResult =
  | { cid: string; previewUrl: string }
  | { error: UploadImageToIpfsErrorCode };

export async function uploadImageToIpfs(
  formData: FormData,
): Promise<UploadImageToIpfsResult> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { error: 'unauthorized' };
  }

  const uploadBase = getIpfsGatewayServerBaseUrl();
  const fetched = await safeFetch(`${uploadBase}/ipfs-gateway/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!fetched.ok) {
    return { error: 'service_unavailable' };
  }

  const res = fetched.response;
  if (!res.ok) {
    return { error: 'upload_failed' };
  }

  let data: { cid?: string };
  try {
    data = (await res.json()) as { cid?: string };
  } catch {
    return { error: 'upload_failed' };
  }

  const cid = data.cid?.trim();
  if (!cid) {
    return { error: 'upload_failed' };
  }
  const contentBase = getIpfsContentBaseUrl() || uploadBase;
  const previewUrl = imageContentUrlForCid(contentBase, cid);
  return { cid, previewUrl };
}
