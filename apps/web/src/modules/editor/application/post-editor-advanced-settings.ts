import {
  buildCommentOptionsBeneficiaryExtension,
  buildCommentOptionsOp,
} from '@opden-data-layer/hive-broadcast';
import type { CommentOptionsOp } from '@opden-data-layer/hive-broadcast';

import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';

import {
  EDITOR_REWARD_MODE_METADATA_KEY,
  HIVE_BENEFICIARY_WEIGHT_MIN,
  HIVE_BENEFICIARY_WEIGHT_TOTAL,
  HIVE_MAX_ACCEPTED_PAYOUT_DECLINED,
  HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT,
  HIVE_PERCENT_HBD_ALL_HP,
  HIVE_PERCENT_HBD_FIFTY_FIFTY,
  POST_EDITOR_DEFAULT_TAG,
  POST_EDITOR_MAX_TAGS,
  DEFAULT_POST_EDITOR_REWARD_MODE,
  type PostEditorBeneficiary,
  type PostEditorRewardMode,
} from '../domain/post-editor-advanced-settings';

const TAG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Waivio `objects_core.object_type` for hashtag objects. */
export const POST_EDITOR_HASHTAG_OBJECT_TYPE = 'hashtag';

export type PostEditorBeneficiariesValidation = {
  ok: boolean;
  overTotal: boolean;
  belowMinWeight: boolean;
  hasAuthor: boolean;
  hasDuplicate: boolean;
};

export function percentToBeneficiaryWeight(percent: number): number {
  const clamped = Math.min(99, Math.max(1, Math.round(percent)));
  return clamped * 100;
}

export function beneficiaryWeightToPercent(weight: number): number {
  return Math.round(weight / 100);
}

export function normalizePostEditorTag(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#+/, '').toLowerCase();
  if (!trimmed || !TAG_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function parseTagsFromJsonMetadata(meta: unknown): string[] {
  if (!meta || typeof meta !== 'object') {
    return [];
  }
  const tags = (meta as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) {
    return [];
  }
  const out: string[] = [];
  for (const item of tags) {
    if (typeof item !== 'string') {
      continue;
    }
    const normalized = normalizePostEditorTag(item);
    if (normalized && !out.includes(normalized)) {
      out.push(normalized);
    }
  }
  return out;
}

export function parseRewardModeFromJsonMetadata(
  meta: unknown,
): PostEditorRewardMode {
  if (!meta || typeof meta !== 'object') {
    return DEFAULT_POST_EDITOR_REWARD_MODE;
  }
  const raw = (meta as Record<string, unknown>)[EDITOR_REWARD_MODE_METADATA_KEY];
  if (raw === 'fifty_fifty' || raw === 'hive_power' || raw === 'declined') {
    return raw;
  }
  return DEFAULT_POST_EDITOR_REWARD_MODE;
}

export function mergeTagsIntoJsonMetadata(
  meta: unknown,
  tags: readonly string[],
): Record<string, unknown> {
  const base =
    meta && typeof meta === 'object' && !Array.isArray(meta)
      ? { ...(meta as Record<string, unknown>) }
      : {};
  return { ...base, tags: [...tags] };
}

export function mergeRewardModeIntoJsonMetadata(
  meta: unknown,
  rewardMode: PostEditorRewardMode,
): Record<string, unknown> {
  const withTags =
    meta && typeof meta === 'object' && !Array.isArray(meta)
      ? { ...(meta as Record<string, unknown>) }
      : {};
  return { ...withTags, [EDITOR_REWARD_MODE_METADATA_KEY]: rewardMode };
}

/** Removes editor-only keys before publishing to Hive. */
export function stripEditorOnlyJsonMetadataFields(
  meta: Record<string, unknown>,
): Record<string, unknown> {
  const { [EDITOR_REWARD_MODE_METADATA_KEY]: _removed, ...rest } = meta;
  return rest;
}

export function buildPublishTags(
  userTags: readonly string[],
  community: string,
): string[] {
  const normalized: string[] = [];
  for (const tag of userTags) {
    const n = normalizePostEditorTag(tag);
    if (n && !normalized.includes(n)) {
      normalized.push(n);
    }
  }
  if (normalized.length === 0) {
    const c = normalizePostEditorTag(community);
    return c ? [c] : [];
  }
  return normalized;
}

function parseBeneficiaryEntry(item: unknown): PostEditorBeneficiary | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const o = item as { account?: unknown; weight?: unknown };
  const account =
    typeof o.account === 'string' ? o.account.trim().toLowerCase() : '';
  if (!account) {
    return null;
  }
  let weight: number;
  if (typeof o.weight === 'number' && Number.isFinite(o.weight)) {
    weight = Math.round(o.weight);
  } else if (typeof o.weight === 'string' && o.weight.trim()) {
    const n = Number(o.weight);
    weight = Number.isFinite(n) ? Math.round(n) : 0;
  } else {
    return null;
  }
  if (weight < HIVE_BENEFICIARY_WEIGHT_MIN || weight > HIVE_BENEFICIARY_WEIGHT_TOTAL) {
    return null;
  }
  return { account, weight };
}

export function parseBeneficiariesFromDraft(
  raw: unknown,
  defaultBeneficiary: PostEditorBeneficiary | null,
): PostEditorBeneficiary[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultBeneficiary ? [{ ...defaultBeneficiary }] : [];
  }
  const out: PostEditorBeneficiary[] = [];
  for (const item of raw) {
    const b = parseBeneficiaryEntry(item);
    if (!b) {
      continue;
    }
    if (!out.some((x) => x.account === b.account)) {
      out.push(b);
    }
  }
  return out;
}

export function serializeBeneficiariesForPersist(
  beneficiaries: readonly PostEditorBeneficiary[],
): string {
  return JSON.stringify(
    beneficiaries.map((b) => ({ account: b.account, weight: b.weight })),
  );
}

export function sumBeneficiaryWeights(
  beneficiaries: readonly PostEditorBeneficiary[],
): number {
  return beneficiaries.reduce((s, b) => s + b.weight, 0);
}

export function authorBeneficiaryRemainderWeight(
  beneficiaries: readonly PostEditorBeneficiary[],
): number {
  return Math.max(0, HIVE_BENEFICIARY_WEIGHT_TOTAL - sumBeneficiaryWeights(beneficiaries));
}

export function validateBeneficiaries(
  beneficiaries: readonly PostEditorBeneficiary[],
  authorAccount: string,
): PostEditorBeneficiariesValidation {
  const author = authorAccount.trim().toLowerCase();
  let belowMinWeight = false;
  let hasDuplicate = false;
  const seen = new Set<string>();
  for (const b of beneficiaries) {
    if (b.weight < HIVE_BENEFICIARY_WEIGHT_MIN) {
      belowMinWeight = true;
    }
    if (seen.has(b.account)) {
      hasDuplicate = true;
    }
    seen.add(b.account);
  }
  const sum = sumBeneficiaryWeights(beneficiaries);
  const overTotal = sum > HIVE_BENEFICIARY_WEIGHT_TOTAL;
  const hasAuthor = beneficiaries.some((b) => b.account === author);
  return {
    ok: !overTotal && !belowMinWeight && !hasDuplicate && !hasAuthor,
    overTotal,
    belowMinWeight,
    hasAuthor,
    hasDuplicate,
  };
}

/** Updates one beneficiary weight only (1–100%); others unchanged. */
export function applyBeneficiaryWeight(
  beneficiaries: readonly PostEditorBeneficiary[],
  account: string,
  newWeight: number,
): PostEditorBeneficiary[] {
  const targetAccount = account.trim().toLowerCase();
  const clamped = Math.round(
    Math.max(
      HIVE_BENEFICIARY_WEIGHT_MIN,
      Math.min(HIVE_BENEFICIARY_WEIGHT_TOTAL, newWeight),
    ),
  );
  return beneficiaries.map((b) =>
    b.account === targetAccount ? { ...b, weight: clamped } : b,
  );
}

export function beneficiariesForPublish(
  beneficiaries: readonly PostEditorBeneficiary[],
): PostEditorBeneficiary[] {
  return beneficiaries.filter((b) => b.weight >= HIVE_BENEFICIARY_WEIGHT_MIN);
}

export function appendBeneficiaryIfAbsent(
  beneficiaries: readonly PostEditorBeneficiary[],
  account: string,
  initialWeight: number,
): { beneficiaries: PostEditorBeneficiary[]; added: boolean } {
  const name = account.trim().toLowerCase();
  if (!name || beneficiaries.some((b) => b.account === name)) {
    return { beneficiaries: [...beneficiaries], added: false };
  }
  const weight = Math.max(
    HIVE_BENEFICIARY_WEIGHT_MIN,
    Math.round(initialWeight),
  );
  return {
    beneficiaries: [...beneficiaries, { account: name, weight }],
    added: true,
  };
}

export function canAddPostEditorTag(
  tags: readonly string[],
  candidate: string,
): boolean {
  const normalized = normalizePostEditorTag(candidate);
  if (!normalized || tags.includes(normalized)) {
    return false;
  }
  return tags.length < POST_EDITOR_MAX_TAGS;
}

export function addPostEditorTag(
  tags: readonly string[],
  raw: string,
): string[] {
  const normalized = normalizePostEditorTag(raw);
  if (!normalized || !canAddPostEditorTag(tags, normalized)) {
    return [...tags];
  }
  return [...tags, normalized];
}

export function removePostEditorTag(
  tags: readonly string[],
  tag: string,
): string[] {
  const normalized = normalizePostEditorTag(tag) ?? tag;
  return tags.filter((t) => t !== normalized);
}

export function isPostEditorHashtagObject(
  result: Pick<SearchObjectResult, 'object_type'>,
): boolean {
  return (
    result.object_type?.trim().toLowerCase() === POST_EDITOR_HASHTAG_OBJECT_TYPE
  );
}

/** Tag token for Advanced settings when linking a hashtag object (name, else last segment of object_id). */
export function postEditorTagCandidateFromHashtagObject(
  result: Pick<SearchObjectResult, 'object_type' | 'name' | 'object_id'>,
): string | null {
  if (!isPostEditorHashtagObject(result)) {
    return null;
  }
  const fromName = result.name?.trim();
  if (fromName) {
    const normalized = normalizePostEditorTag(fromName);
    if (normalized) {
      return normalized;
    }
  }
  const id = result.object_id.trim();
  const token = id.includes('/') ? (id.split('/').pop() ?? id) : id;
  return normalizePostEditorTag(token);
}

export function addPostEditorTagForHashtagObject(
  tags: readonly string[],
  result: Pick<SearchObjectResult, 'object_type' | 'name' | 'object_id'>,
): string[] {
  const candidate = postEditorTagCandidateFromHashtagObject(result);
  if (!candidate) {
    return [...tags];
  }
  return addPostEditorTag(tags, candidate);
}

export type RewardCommentOptionsFields = {
  max_accepted_payout: string;
  percent_hbd?: number;
};

export function rewardModeToCommentOptionsFields(
  mode: PostEditorRewardMode,
): RewardCommentOptionsFields {
  if (mode === 'declined') {
    return { max_accepted_payout: HIVE_MAX_ACCEPTED_PAYOUT_DECLINED };
  }
  if (mode === 'hive_power') {
    return {
      max_accepted_payout: HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT,
      percent_hbd: HIVE_PERCENT_HBD_ALL_HP,
    };
  }
  return {
    max_accepted_payout: HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT,
    percent_hbd: HIVE_PERCENT_HBD_FIFTY_FIFTY,
  };
}

export function buildPublishCommentOptions(input: {
  author: string;
  permlink: string;
  rewardMode: PostEditorRewardMode;
  beneficiaries: readonly PostEditorBeneficiary[];
}): CommentOptionsOp {
  const fields = rewardModeToCommentOptionsFields(input.rewardMode);
  const extensions: unknown[] = [];
  const publishBeneficiaries = beneficiariesForPublish(input.beneficiaries);
  if (publishBeneficiaries.length > 0) {
    extensions.push(
      buildCommentOptionsBeneficiaryExtension(
        publishBeneficiaries.map((b) => ({
          account: b.account,
          weight: b.weight,
        })),
      ),
    );
  }
  return buildCommentOptionsOp({
    author: input.author,
    permlink: input.permlink,
    max_accepted_payout: fields.max_accepted_payout,
    allow_votes: true,
    allow_curation_rewards: true,
    ...(fields.percent_hbd !== undefined ? { percent_hbd: fields.percent_hbd } : {}),
    extensions,
  });
}

export function initialPostEditorTags(
  meta: unknown,
  useDefaults: boolean,
): string[] {
  const fromMeta = parseTagsFromJsonMetadata(meta);
  if (fromMeta.length > 0) {
    return fromMeta;
  }
  return useDefaults ? [POST_EDITOR_DEFAULT_TAG] : [];
}
