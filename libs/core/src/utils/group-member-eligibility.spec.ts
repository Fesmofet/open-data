import {
  checkGroupMemberEligibility,
  toGovernanceMutedSet,
} from '@opden-data-layer/core';

describe('checkGroupMemberEligibility', () => {
  const emptyGov = toGovernanceMutedSet([]);

  it('allows when no mute or governance conflict', () => {
    expect(
      checkGroupMemberEligibility({
        adder: 'alice',
        target: 'bob',
        governanceMuted: emptyGov,
        targetMutedAdder: false,
        adderMutedTarget: false,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects when target muted adder', () => {
    expect(
      checkGroupMemberEligibility({
        adder: 'alice',
        target: 'bob',
        governanceMuted: emptyGov,
        targetMutedAdder: true,
        adderMutedTarget: false,
      }),
    ).toEqual({ ok: false, reason: 'target_muted_adder' });
  });

  it('rejects when adder muted target', () => {
    expect(
      checkGroupMemberEligibility({
        adder: 'alice',
        target: 'bob',
        governanceMuted: emptyGov,
        targetMutedAdder: false,
        adderMutedTarget: true,
      }),
    ).toEqual({ ok: false, reason: 'adder_muted_target' });
  });

  it('rejects when target on governance mute list', () => {
    expect(
      checkGroupMemberEligibility({
        adder: 'alice',
        target: 'bob',
        governanceMuted: toGovernanceMutedSet(['bob']),
        targetMutedAdder: false,
        adderMutedTarget: false,
      }),
    ).toEqual({ ok: false, reason: 'target_governance_muted' });
  });

  it('rejects when adder on governance mute list', () => {
    expect(
      checkGroupMemberEligibility({
        adder: 'alice',
        target: 'bob',
        governanceMuted: toGovernanceMutedSet(['alice']),
        targetMutedAdder: false,
        adderMutedTarget: false,
      }),
    ).toEqual({ ok: false, reason: 'adder_governance_muted' });
  });
});
