'use server';

import { getIpfsGatewayServerBaseUrl } from '@/config/get-ipfs-gateway-server-base-url';
import { getBearerAccessToken } from '@/shared/infrastructure/auth/get-bearer-access-token.server';
import { safeFetch } from '@/shared/infrastructure/http/safe-fetch.server';

export type UploadOdlToIpfsResult = { cid: string } | { error: string };

export async function uploadOdlToIpfs(
  odlJson: string,
): Promise<UploadOdlToIpfsResult> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { error: 'unauthorized' };
  }

  const uploadBase = getIpfsGatewayServerBaseUrl();
  const fetched = await safeFetch(
    `${uploadBase}/ipfs-gateway/upload/file?filename=odl-batch.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${token}`,
      },
      body: odlJson,
      signal: AbortSignal.timeout(60_000),
    },
  );
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
  return { cid };
}
