import { getImagePathPost } from '@/shared/infrastructure/image/get-proxy-image-url';

import { DEFAULT_OG_IMAGE_PATH } from './constants';
import { toAbsoluteUrl } from './to-absolute-url';

function isAbsoluteRemoteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('//');
}

export function resolveOgImageUrl(
  candidates: ReadonlyArray<string | null | undefined>,
  origin: string | null,
): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) {
      continue;
    }
    // Remote UGC (incl. dead IPFS gateways) → Hive 0x0 proxy.
    if (isAbsoluteRemoteUrl(trimmed)) {
      const proxied = getImagePathPost(trimmed);
      if (proxied) {
        return proxied;
      }
      continue;
    }
    // Site-relative assets — do not send through Hive proxy.
    const absolute = toAbsoluteUrl(trimmed, origin);
    if (absolute) {
      return absolute;
    }
  }
  return origin ? toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, origin) : null;
}
