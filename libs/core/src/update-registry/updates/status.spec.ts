import { UPDATE_STATUS_SCHEMA } from './status';

describe('UPDATE_STATUS_SCHEMA', () => {
  it('accepts relisted with non-empty link', () => {
    const result = UPDATE_STATUS_SCHEMA.safeParse({
      title: 'relisted',
      link: 'target-object-id',
    });
    expect(result.success).toBe(true);
  });

  it('rejects relisted without link', () => {
    expect(
      UPDATE_STATUS_SCHEMA.safeParse({ title: 'relisted' }).success,
    ).toBe(false);
    expect(
      UPDATE_STATUS_SCHEMA.safeParse({ title: 'relisted', link: '' }).success,
    ).toBe(false);
    expect(
      UPDATE_STATUS_SCHEMA.safeParse({ title: 'relisted', link: '   ' }).success,
    ).toBe(false);
  });

  it('accepts non-relisted statuses without link', () => {
    for (const title of ['active', 'unavailable', 'nsfw', 'flagged'] as const) {
      expect(
        UPDATE_STATUS_SCHEMA.safeParse({ title }).success,
      ).toBe(true);
    }
  });
});
