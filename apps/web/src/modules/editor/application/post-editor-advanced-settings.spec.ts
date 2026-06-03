import {
  HIVE_PERCENT_HBD_ALL_HP,
  HIVE_PERCENT_HBD_FIFTY_FIFTY,
  HIVE_MAX_ACCEPTED_PAYOUT_DECLINED,
  HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT,
} from '../domain/post-editor-advanced-settings';
import {
  addPostEditorTag,
  appendBeneficiaryIfAbsent,
  applyBeneficiaryWeight,
  buildPublishCommentOptions,
  buildPublishTags,
  normalizePostEditorTag,
  parseBeneficiariesFromDraft,
  parseRewardModeFromJsonMetadata,
  rewardModeToCommentOptionsFields,
  stripEditorOnlyJsonMetadataFields,
  validateBeneficiaries,
} from './post-editor-advanced-settings';

describe('normalizePostEditorTag', () => {
  it('lowercases and strips hash', () => {
    expect(normalizePostEditorTag('#Food')).toBe('food');
  });

  it('rejects invalid characters', () => {
    expect(normalizePostEditorTag('bad tag')).toBeNull();
  });
});

describe('buildPublishTags', () => {
  it('uses community when user tags empty', () => {
    expect(buildPublishTags([], 'opden')).toEqual(['opden']);
  });

  it('does not force waivio', () => {
    expect(buildPublishTags(['food'], 'opden')).toEqual(['food']);
  });
});

describe('parseRewardModeFromJsonMetadata', () => {
  it('reads _editorRewardMode from draft metadata', () => {
    expect(
      parseRewardModeFromJsonMetadata({ _editorRewardMode: 'hive_power' }),
    ).toBe('hive_power');
  });
});

describe('stripEditorOnlyJsonMetadataFields', () => {
  it('removes _editorRewardMode', () => {
    expect(
      stripEditorOnlyJsonMetadataFields({
        tags: ['a'],
        _editorRewardMode: 'declined',
      }),
    ).toEqual({ tags: ['a'] });
  });
});

describe('rewardModeToCommentOptionsFields', () => {
  it('maps fifty_fifty to percent_hbd 10000', () => {
    expect(rewardModeToCommentOptionsFields('fifty_fifty')).toEqual({
      max_accepted_payout: HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT,
      percent_hbd: HIVE_PERCENT_HBD_FIFTY_FIFTY,
    });
  });

  it('maps hive_power to 0', () => {
    expect(rewardModeToCommentOptionsFields('hive_power')).toEqual({
      max_accepted_payout: HIVE_MAX_ACCEPTED_PAYOUT_DEFAULT,
      percent_hbd: HIVE_PERCENT_HBD_ALL_HP,
    });
  });

  it('omits percent_hbd for declined', () => {
    expect(rewardModeToCommentOptionsFields('declined')).toEqual({
      max_accepted_payout: HIVE_MAX_ACCEPTED_PAYOUT_DECLINED,
    });
  });
});

describe('parseBeneficiariesFromDraft', () => {
  it('uses default when draft empty', () => {
    expect(
      parseBeneficiariesFromDraft([], { account: 'waivio', weight: 300 }),
    ).toEqual([{ account: 'waivio', weight: 300 }]);
  });
});

describe('appendBeneficiaryIfAbsent', () => {
  it('adds at 1% without changing existing weights', () => {
    const { beneficiaries, added } = appendBeneficiaryIfAbsent(
      [{ account: 'waivio', weight: 300 }],
      'other',
      100,
    );
    expect(added).toBe(true);
    expect(beneficiaries).toEqual([
      { account: 'waivio', weight: 300 },
      { account: 'other', weight: 100 },
    ]);
  });
});

describe('applyBeneficiaryWeight', () => {
  it('updates only the target beneficiary', () => {
    const out = applyBeneficiaryWeight(
      [
        { account: 'a', weight: 5000 },
        { account: 'b', weight: 5000 },
      ],
      'a',
      7000,
    );
    expect(out).toEqual([
      { account: 'a', weight: 7000 },
      { account: 'b', weight: 5000 },
    ]);
  });
});

describe('validateBeneficiaries', () => {
  it('rejects author in list', () => {
    expect(
      validateBeneficiaries([{ account: 'alice', weight: 300 }], 'alice').ok,
    ).toBe(false);
  });

  it('rejects weight below 1%', () => {
    expect(
      validateBeneficiaries(
        [
          { account: 'waivio', weight: 300 },
          { account: 'other', weight: 0 },
        ],
        'alice',
      ).ok,
    ).toBe(false);
  });
});

describe('buildPublishCommentOptions', () => {
  it('includes beneficiary extension when list non-empty', () => {
    const op = buildPublishCommentOptions({
      author: 'alice',
      permlink: 'my-post',
      rewardMode: 'fifty_fifty',
      beneficiaries: [{ account: 'waivio', weight: 300 }],
    });
    expect(op.type).toBe('comment_options');
    expect(op.percent_hbd).toBe(10000);
    expect(op.extensions).toHaveLength(1);
  });
});

describe('addPostEditorTag', () => {
  it('respects max tags', () => {
    let tags = ['a', 'b', 'c', 'd', 'e'];
    tags = addPostEditorTag(tags, 'f');
    expect(tags).toHaveLength(5);
  });
});
