import { isUserProfileReservedFirstSegment } from './profile-path';

describe('profile-path reserved segments', () => {
  it('treats messages as reserved profile first segment', () => {
    expect(isUserProfileReservedFirstSegment('messages')).toBe(true);
  });

  it('treats permissions as reserved profile first segment', () => {
    expect(isUserProfileReservedFirstSegment('permissions')).toBe(true);
  });
});
