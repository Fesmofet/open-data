/**
 * Normalized Hive operation shapes (domain layer).
 * Signing/broadcast adapters map these to provider-specific wire formats.
 */

export type VoteOp = {
  readonly type: 'vote';
  readonly voter: string;
  readonly author: string;
  readonly permlink: string;
  /** Vote weight in basis points (10000 = 100%). */
  readonly weight: number;
};

export type CommentOp = {
  readonly type: 'comment';
  readonly parent_author: string;
  readonly parent_permlink: string;
  readonly author: string;
  readonly permlink: string;
  readonly title: string;
  readonly body: string;
  readonly json_metadata: string;
};

export type CommentOptionsOp = {
  readonly type: 'comment_options';
  readonly author: string;
  readonly permlink: string;
  readonly max_accepted_payout: string;
  readonly allow_votes: boolean;
  readonly allow_curation_rewards: boolean;
  /** HBD share in basis points (10000 = 100%). Omitted on chain uses default. */
  readonly percent_hbd?: number;
  readonly extensions: readonly unknown[];
};

export type CustomJsonOp = {
  readonly type: 'custom_json';
  readonly required_auths: readonly string[];
  readonly required_posting_auths: readonly string[];
  readonly id: string;
  readonly json: string;
};

export type TransferOp = {
  readonly type: 'transfer';
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly memo: string;
};

export type TransferToVestingOp = {
  readonly type: 'transfer_to_vesting';
  readonly from: string;
  readonly to: string;
  readonly amount: string;
};

export type WithdrawVestingOp = {
  readonly type: 'withdraw_vesting';
  readonly account: string;
  readonly vesting_shares: string;
};

export type DelegateVestingSharesOp = {
  readonly type: 'delegate_vesting_shares';
  readonly delegator: string;
  readonly delegatee: string;
  readonly vesting_shares: string;
};

export type TransferToSavingsOp = {
  readonly type: 'transfer_to_savings';
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly memo: string;
};

export type TransferFromSavingsOp = {
  readonly type: 'transfer_from_savings';
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly memo: string;
};

export type CancelTransferFromSavingsOp = {
  readonly type: 'cancel_transfer_from_savings';
  readonly from: string;
  readonly request_id: number;
};

export type HiveOperation =
  | VoteOp
  | CommentOp
  | CommentOptionsOp
  | CustomJsonOp
  | TransferOp
  | TransferToVestingOp
  | WithdrawVestingOp
  | DelegateVestingSharesOp
  | TransferToSavingsOp
  | TransferFromSavingsOp
  | CancelTransferFromSavingsOp;

export type HiveOperationPayload = {
  readonly operations: readonly HiveOperation[];
};
