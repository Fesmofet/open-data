'use server';

import { getIpfsGatewayServerBaseUrl } from '@/config/get-ipfs-gateway-server-base-url';
import { getBearerAccessToken } from '@/shared/infrastructure/auth/get-bearer-access-token.server';
import { safeFetch } from '@/shared/infrastructure/http/safe-fetch.server';

export type UploadOdlToIpfsResult = { cid: string } | { error: string };

function uploadFilenameForObjectId(objectId: string): string {
  const safe = objectId.trim().replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '');
  return safe.length > 0 ? `odl-${safe}.json` : 'odl-batch.json';
}

export async function uploadOdlToIpfs(
  odlJson: string,
  objectId?: string,
): Promise<UploadOdlToIpfsResult> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { error: 'unauthorized' };
  }

  const uploadBase = getIpfsGatewayServerBaseUrl();
  const filename = uploadFilenameForObjectId(objectId ?? '');
  const fetched = await safeFetch(
    `${uploadBase}/ipfs-gateway/upload/file?filename=${encodeURIComponent(filename)}`,
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
