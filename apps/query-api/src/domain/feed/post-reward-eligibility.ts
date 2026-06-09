import { WAIV_REWARD_ELIGIBLE_TAGS } from '@opden-data-layer/core';

const ELIGIBLE_SET = new Set<string>(WAIV_REWARD_ELIGIBLE_TAGS);

export function parseJsonMetadataTags(jsonMetadata: string | null | undefined): string[] {
  const raw = (jsonMetadata ?? '').trim();
  if (raw === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as { tags?: unknown };
    const tags = parsed.tags;
    if (Array.isArray(tags)) {
      return tags.filter((t): t is string => typeof t === 'string');
    }
    if (typeof tags === 'string') {
      return [tags];
    }
    return [];
  } catch {
    return [];
  }
}

export function isWaivRewardEligible(jsonMetadata: string | null | undefined): boolean {
  const tags = parseJsonMetadataTags(jsonMetadata);
  return tags.some((tag) => ELIGIBLE_SET.has(tag));
}
