/** Keep in sync with `apps/ipfs-gateway` `ImageProcessorService` allowed MIME types. */
const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
};

export function mimeFromImageExtension(extension: string): string | null {
  const normalized = extension.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const withDot = normalized.startsWith('.') ? normalized : `.${normalized}`;
  return EXTENSION_TO_MIME[withDot] ?? null;
}
