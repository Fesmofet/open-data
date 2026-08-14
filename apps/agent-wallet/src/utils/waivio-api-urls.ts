export function normalizeApiOrigin(origin: string): string {
  const trimmed = origin.trim();
  if (!trimmed) {
    return 'https://waiviodev.com';
  }
  return trimmed.replace(/\/$/, '');
}

export function buildWaivioAuthBaseUrl(origin: string): string {
  return `${normalizeApiOrigin(origin)}/auth/v1`;
}

export function buildWaivioIpfsGatewayBaseUrl(origin: string): string {
  return `${normalizeApiOrigin(origin)}/ipfs-gateway`;
}

/** `{origin}/ipfs-gateway/content/image/{cid}` */
export function imageContentUrlForCid(origin: string, cid: string): string {
  return `${buildWaivioIpfsGatewayBaseUrl(origin)}/content/image/${cid}`;
}
