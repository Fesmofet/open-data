import {
  checkGroupMemberEligibility,
  toGovernanceMutedSet,
  type GroupMemberBlockReason,
} from '@opden-data-layer/core';

export type MuteExistsFn = (muter: string, muted: string) => Promise<boolean>;

export async function canAddGroupMember(input: {
  adder: string;
  target: string;
  governanceMutedAccounts: readonly string[];
  muteExists: MuteExistsFn;
}): Promise<{ ok: true } | { ok: false; reason: GroupMemberBlockReason }> {
  const adder = input.adder.trim();
  const target = input.target.trim();
  if (adder.toLowerCase() === target.toLowerCase()) {
    return { ok: false, reason: 'adder_muted_target' };
  }

  const governanceMuted = toGovernanceMutedSet(input.governanceMutedAccounts);
  const [targetMutedAdder, adderMutedTarget] = await Promise.all([
    input.muteExists(target, adder),
    input.muteExists(adder, target),
  ]);

  return checkGroupMemberEligibility({
    adder,
    target,
    governanceMuted,
    targetMutedAdder,
    adderMutedTarget,
  });
}
