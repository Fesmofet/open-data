export type GroupMemberBlockReason =
  | 'target_muted_adder'
  | 'adder_muted_target'
  | 'target_governance_muted'
  | 'adder_governance_muted';

export type GroupMemberEligibilityResult =
  | { ok: true }
  | { ok: false; reason: GroupMemberBlockReason };

export function checkGroupMemberEligibility(input: {
  adder: string;
  target: string;
  governanceMuted: ReadonlySet<string>;
  targetMutedAdder: boolean;
  adderMutedTarget: boolean;
}): GroupMemberEligibilityResult {
  const adder = input.adder.trim().toLowerCase();
  const target = input.target.trim().toLowerCase();
  if (adder === target) {
    return { ok: false, reason: 'adder_muted_target' };
  }
  if (input.targetMutedAdder) {
    return { ok: false, reason: 'target_muted_adder' };
  }
  if (input.adderMutedTarget) {
    return { ok: false, reason: 'adder_muted_target' };
  }
  if (input.governanceMuted.has(target)) {
    return { ok: false, reason: 'target_governance_muted' };
  }
  if (input.governanceMuted.has(adder)) {
    return { ok: false, reason: 'adder_governance_muted' };
  }
  return { ok: true };
}

export function toGovernanceMutedSet(mutedAccounts: readonly string[]): Set<string> {
  return new Set(mutedAccounts.map((account) => account.trim().toLowerCase()));
}
