import { extractCidFromContentGatewayUrl } from '@/config/ipfs-content-url';

/** First http(s) URL in pasted plain text. */
export function parseHttpUrlFromPaste(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

const IMAGE_PATH_EXT = /\.(?:jpe?g|png|gif|webp|svg|avif|bmp)$/i;

/** True when the URL is an image pathname or our content-gateway image URL. */
export function looksLikeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  if (extractCidFromContentGatewayUrl(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return false;
    }
    if (/%20/i.test(parsed.pathname)) {
      return false;
    }
    return IMAGE_PATH_EXT.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** First image-like http(s) URL in pasted plain text, or null. */
export function parseImageUrlFromPaste(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  let httpUrl: string | null;
  if (/^https?:\/\//i.test(trimmed) && /\s/.test(trimmed)) {
    const first = trimmed.match(/^https?:\/\/[^\s]+/i);
    httpUrl = first ? first[0] : null;
  } else {
    httpUrl = parseHttpUrlFromPaste(text);
  }

  if (!httpUrl) {
    return null;
  }
  return looksLikeImageUrl(httpUrl) ? httpUrl : null;
}

export function imageFileFromClipboard(
  data: DataTransfer | null,
): File | null {
  if (!data?.items?.length) {
    return null;
  }
  for (const item of data.items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}
