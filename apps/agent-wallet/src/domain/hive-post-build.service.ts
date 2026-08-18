import { Injectable } from '@nestjs/common';
import {
  WAIV_REWARD_ELIGIBLE_TAGS,
  isWaivRewardEligible,
} from '@opden-data-layer/core';
import {
  buildCommentOp,
  buildCommentOptionsBeneficiaryExtension,
  buildCommentOptionsOp,
  type HiveOperation,
} from '@opden-data-layer/hive-broadcast';

import { createRootPostPermlink, sanitizeHivePermlink } from './hive-post-permlink';

const HIVE_BENEFICIARY_WEIGHT_TOTAL = 10000;
const HIVE_BENEFICIARY_WEIGHT_MIN = 100;
const HIVE_BENEFICIARY_WEIGHT_MAX = 9900;
const HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT = '1000000.000 HBD';
const HIVE_MAX_ACCEPTED_PAYOUT_DECLINED = '0.000 HBD';
const HIVE_PERCENT_HBD_FIFTY_FIFTY = 10000;
const HIVE_PERCENT_HBD_ALL_HP = 0;
const OBJECTS_PERCENT_TOTAL = 100;
const DEFAULT_PARENT_PERMLINK = 'waivio';
const DEFAULT_APP = 'waivio/1.0.0';

export type HivePostRewardMode = 'fifty_fifty' | 'hive_power' | 'declined';

export type HivePostLinkedObject = {
  object_id: string;
  percent: number;
};

export type HivePostBeneficiary = {
  account: string;
  weight: number;
};

export type HiveBuildPostInput = {
  author: string;
  title: string;
  body: string;
  permlink?: string;
  tags?: string[];
  objects?: HivePostLinkedObject[];
  beneficiaries?: HivePostBeneficiary[];
  rewardMode?: HivePostRewardMode;
  parentPermlink?: string;
  app?: string;
  host?: string;
};

export type HiveBuildPostResult = {
  ops: HiveOperation[];
  opsCount: 2;
  json_metadata: Record<string, unknown>;
  warnings: string[];
};

function normalizeTag(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/[^a-z0-9-]+/g, '');
}

function normalizeTags(tags: readonly string[] | undefined): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }
  const out: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (normalized && !out.includes(normalized)) {
      out.push(normalized);
    }
  }
  return out;
}

function validateLinkedObjects(
  objects: readonly HivePostLinkedObject[] | undefined,
): void {
  if (!objects || objects.length === 0) {
    return;
  }
  let sum = 0;
  const seen = new Set<string>();
  for (const item of objects) {
    const objectId = item.object_id?.trim();
    if (!objectId) {
      throw new Error('objects[].object_id is required');
    }
    if (seen.has(objectId)) {
      throw new Error(`duplicate object_id: ${objectId}`);
    }
    seen.add(objectId);
    if (!Number.isFinite(item.percent)) {
      throw new Error(`invalid percent for object ${objectId}`);
    }
    const percent = Math.round(item.percent);
    if (percent < 0 || percent > OBJECTS_PERCENT_TOTAL) {
      throw new Error(
        `object percent must be 0–${OBJECTS_PERCENT_TOTAL}: ${objectId}`,
      );
    }
    sum += percent;
  }
  if (sum > OBJECTS_PERCENT_TOTAL) {
    throw new Error(
      `sum of object percents must be ≤ ${OBJECTS_PERCENT_TOTAL} (got ${sum})`,
    );
  }
}

function validateBeneficiaries(
  beneficiaries: readonly HivePostBeneficiary[],
  authorAccount: string,
): void {
  if (beneficiaries.length === 0) {
    return;
  }
  const author = authorAccount.trim().toLowerCase();
  const seen = new Set<string>();
  let sum = 0;
  for (const b of beneficiaries) {
    const account = b.account?.trim().toLowerCase();
    if (!account) {
      throw new Error('beneficiaries[].account is required');
    }
    if (account === author) {
      throw new Error('author cannot be a beneficiary');
    }
    if (seen.has(account)) {
      throw new Error(`duplicate beneficiary account: ${account}`);
    }
    seen.add(account);
    if (!Number.isFinite(b.weight)) {
      throw new Error(`invalid weight for beneficiary ${account}`);
    }
    const weight = Math.round(b.weight);
    if (weight < HIVE_BENEFICIARY_WEIGHT_MIN || weight > HIVE_BENEFICIARY_WEIGHT_MAX) {
      throw new Error(
        `beneficiary weight must be ${HIVE_BENEFICIARY_WEIGHT_MIN}–${HIVE_BENEFICIARY_WEIGHT_MAX}: ${account}`,
      );
    }
    sum += weight;
  }
  if (sum > HIVE_BENEFICIARY_WEIGHT_TOTAL) {
    throw new Error(
      `sum of beneficiary weights must be ≤ ${HIVE_BENEFICIARY_WEIGHT_TOTAL} (got ${sum})`,
    );
  }
}

function rewardModeToCommentOptionsFields(mode: HivePostRewardMode): {
  max_accepted_payout: string;
  percent_hbd?: number;
} {
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

function buildCommentOptions(input: {
  author: string;
  permlink: string;
  rewardMode: HivePostRewardMode;
  beneficiaries: readonly HivePostBeneficiary[];
}): HiveOperation {
  const fields = rewardModeToCommentOptionsFields(input.rewardMode);
  const extensions: unknown[] = [];
  const publishBeneficiaries = input.beneficiaries.map((b) => ({
    account: b.account.trim().toLowerCase(),
    weight: Math.round(b.weight),
  }));
  if (publishBeneficiaries.length > 0) {
    extensions.push(
      buildCommentOptionsBeneficiaryExtension(publishBeneficiaries),
    );
  }
  return buildCommentOptionsOp({
    author: input.author.trim(),
    permlink: input.permlink,
    max_accepted_payout: fields.max_accepted_payout,
    allow_votes: true,
    allow_curation_rewards: true,
    ...(fields.percent_hbd !== undefined ? { percent_hbd: fields.percent_hbd } : {}),
    extensions,
  });
}

@Injectable()
export class HivePostBuildService {
  buildPost(input: HiveBuildPostInput): HiveBuildPostResult {
    const author = input.author?.trim();
    const title = input.title?.trim();
    const body = input.body?.trim();
    if (!author) {
      throw new Error('author is required');
    }
    if (!title) {
      throw new Error('title is required');
    }
    if (!body) {
      throw new Error('body is required');
    }

    const parentPermlink = sanitizeHivePermlink(
      input.parentPermlink?.trim() || DEFAULT_PARENT_PERMLINK,
    );
    if (!parentPermlink) {
      throw new Error('parentPermlink is invalid');
    }

    const permlink = input.permlink?.trim()
      ? sanitizeHivePermlink(input.permlink.trim())
      : createRootPostPermlink(title);
    if (!permlink) {
      throw new Error('permlink is invalid');
    }

    const tags = normalizeTags(input.tags);
    const objects = input.objects ?? [];
    const beneficiaries = (input.beneficiaries ?? []).map((b) => ({
      account: b.account.trim().toLowerCase(),
      weight: Math.round(b.weight),
    }));
    const rewardMode = input.rewardMode ?? 'fifty_fifty';

    validateLinkedObjects(objects);
    validateBeneficiaries(beneficiaries, author);

    const warnings: string[] = [];
    const json_metadata: Record<string, unknown> = {
      app: input.app?.trim() || DEFAULT_APP,
      ...(input.host?.trim() ? { host: input.host.trim() } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(objects.length > 0
        ? {
            objects: objects.map((o) => ({
              object_id: o.object_id.trim(),
              percent: Math.round(o.percent),
            })),
          }
        : {}),
    };

    const metadataJson = JSON.stringify(json_metadata);
    if (!isWaivRewardEligible(metadataJson)) {
      warnings.push(
        `No WAIV-eligible tag in json_metadata.tags — post will not receive WAIV potential rewards. Add at least one of: ${WAIV_REWARD_ELIGIBLE_TAGS.join(', ')}`,
      );
    }

    const commentOp = buildCommentOp({
      parent_author: '',
      parent_permlink: parentPermlink,
      author,
      permlink,
      title,
      body,
      json_metadata: metadataJson,
    });

    const optionsOp = buildCommentOptions({
      author,
      permlink,
      rewardMode,
      beneficiaries,
    });

    return {
      ops: [commentOp, optionsOp],
      opsCount: 2,
      json_metadata,
      warnings,
    };
  }
}
