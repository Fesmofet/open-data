/** Default hashtag chip for new posts (removable in UI). */
export const POST_EDITOR_DEFAULT_TAG = 'waivio';

/** Max hashtags in editor (aligned with legacy `hashtags_error_count`). */
export const POST_EDITOR_MAX_TAGS = 5;

/** Hive beneficiary weight scale (basis points; 10000 = 100%). */
export const HIVE_BENEFICIARY_WEIGHT_TOTAL = 10000;

/** Minimum beneficiary weight (1%). */
export const HIVE_BENEFICIARY_WEIGHT_MIN = 100;

/** Hive `comment_options.percent_hbd` for 50% HBD / 50% HP. */
export const HIVE_PERCENT_HBD_FIFTY_FIFTY = 5000;

/** Hive `comment_options.percent_hbd` for 100% HP. */
export const HIVE_PERCENT_HBD_ALL_HP = 0;

export const HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT = '1000000.000 HBD';

export const HIVE_MAX_ACCEPTED_PAYOUT_DECLINED = '0.000 HBD';

/** Persisted in draft `jsonMetadata` only; stripped before chain publish. */
export const EDITOR_REWARD_MODE_METADATA_KEY = '_editorRewardMode';

export type PostEditorRewardMode = 'fifty_fifty' | 'hive_power' | 'declined';

export type PostEditorBeneficiary = {
  account: string;
  weight: number;
};

export const DEFAULT_POST_EDITOR_REWARD_MODE: PostEditorRewardMode = 'fifty_fifty';

export const DEFAULT_POST_EDITOR_TAGS: readonly string[] = [POST_EDITOR_DEFAULT_TAG];
