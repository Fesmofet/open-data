/**
 * Builds Hive `json_metadata.image` array for post publish (HTTPS URLs, not CIDs).
 */
export function buildHivePostImageMetadata(
  imageCids: readonly string[],
  contentBaseUrl: string | null | undefined,
  resolveImageUrl: (cid: string) => string,
): string[] {
  return imageCids.map((cid) =>
    contentBaseUrl ? resolveImageUrl(cid) : cid,
  );
}
