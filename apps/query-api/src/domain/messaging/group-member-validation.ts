import {
  checkGroupMemberEligibility,
  MAX_GROUP_CHANNEL_MEMBERS,
  toGovernanceMutedSet,
  type GroupMemberBlockReason,
} from '@opden-data-layer/core';

export type ValidateMemberReason =
  | 'muted_by_viewer'
  | 'muted_viewer'
  | 'governance_muted'
  | 'already_member'
  | 'group_full';

export type ValidateMemberResult = {
  account: string;
  addable: boolean;
  reason?: ValidateMemberReason;
};

export function mapBlockReasonToValidateReason(
  reason: GroupMemberBlockReason,
): ValidateMemberReason {
  switch (reason) {
    case 'target_muted_adder':
      return 'muted_viewer';
    case 'adder_muted_target':
      return 'muted_by_viewer';
    case 'target_governance_muted':
    case 'adder_governance_muted':
      return 'governance_muted';
  }
}

export async function evaluateAddableMembers(input: {
  adder: string;
  accounts: readonly string[];
  governanceMutedAccounts: readonly string[];
  existingMemberAccounts: ReadonlySet<string>;
  currentMemberCount: number;
  muteExists: (muter: string, muted: string) => Promise<boolean>;
}): Promise<ValidateMemberResult[]> {
  const adder = input.adder.trim();
  const governanceMuted = toGovernanceMutedSet(input.governanceMutedAccounts);
  const seen = new Set<string>();
  const results: ValidateMemberResult[] = [];
  let projectedCount = input.currentMemberCount;

  for (const rawAccount of input.accounts) {
    const account = rawAccount.trim();
    const dedupeKey = account.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    if (input.existingMemberAccounts.has(account)) {
      results.push({ account, addable: false, reason: 'already_member' });
      continue;
    }

    if (projectedCount >= MAX_GROUP_CHANNEL_MEMBERS) {
      results.push({ account, addable: false, reason: 'group_full' });
      continue;
    }

    const [targetMutedAdder, adderMutedTarget] = await Promise.all([
      input.muteExists(account, adder),
      input.muteExists(adder, account),
    ]);

    const eligibility = checkGroupMemberEligibility({
      adder,
      target: account,
      governanceMuted,
      targetMutedAdder,
      adderMutedTarget,
    });

    if (!eligibility.ok) {
      results.push({
        account,
        addable: false,
        reason: mapBlockReasonToValidateReason(eligibility.reason),
      });
      continue;
    }

    results.push({ account, addable: true });
    projectedCount += 1;
  }

  return results;
}
