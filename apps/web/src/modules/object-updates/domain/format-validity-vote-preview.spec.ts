import { formatValidityVotePreview } from './format-validity-vote-preview';

describe('formatValidityVotePreview', () => {
  const t = (key: string) => {
    const messages: Record<string, string> = {
      object_updates_vote_preview_for_one: '{user} approved',
      object_updates_vote_preview_for_two: '{first} and {second} approved',
      object_updates_vote_preview_for_many: '{first}, {second} and {more} more approved',
      object_updates_vote_preview_for_count: '{count} approvals',
      object_updates_vote_preview_against_one: '{user} rejected',
      object_updates_vote_preview_against_two: '{first} and {second} rejected',
      object_updates_vote_preview_against_many: '{first}, {second} and {more} more rejected',
      object_updates_vote_preview_against_count: '{count} rejections',
    };
    return messages[key] ?? key;
  };

  it('returns null for zero count', () => {
    expect(formatValidityVotePreview(0, [], t, 'for')).toBeNull();
  });

  it('formats single approve preview', () => {
    expect(formatValidityVotePreview(1, ['alice'], t, 'for')).toBe('@alice approved');
  });

  it('formats multi approve preview', () => {
    expect(formatValidityVotePreview(3, ['alice', 'bob'], t, 'for')).toBe(
      '@alice, @bob and 1 more approved',
    );
  });
});
