import { UPDATE_COMPATIBILITY } from './compatibility';

describe('UPDATE_COMPATIBILITY', () => {
  it('enforces max 500 characters', () => {
    expect(UPDATE_COMPATIBILITY.schema.safeParse('a'.repeat(500)).success).toBe(true);
    expect(UPDATE_COMPATIBILITY.schema.safeParse('a'.repeat(501)).success).toBe(false);
  });
});
