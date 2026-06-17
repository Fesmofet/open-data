/** Max characters shown in object card description excerpts (shop, feed, list menu). */
export const OBJECT_CARD_DESCRIPTION_MAX_LENGTH = 300;

/** Shorter excerpt for profile map sidebar (narrow column). */
export const OBJECT_CARD_MAP_SIDEBAR_DESCRIPTION_MAX_LENGTH = 100;

export function truncateObjectCardDescription(
  text: string,
  maxLength: number = OBJECT_CARD_DESCRIPTION_MAX_LENGTH,
): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}
