import { isUserProfileReservedFirstSegment } from './profile-path';

describe('profile-path messages segment', () => {
  it('treats messages as reserved profile first segment', () => {
    expect(isUserProfileReservedFirstSegment('messages')).toBe(true);
  });
});
