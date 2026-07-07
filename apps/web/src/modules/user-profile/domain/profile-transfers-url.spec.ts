import { isUserProfileTransfersTab } from './profile-transfers-url';

describe('isUserProfileTransfersTab', () => {
  it('matches public profile transfers URLs', () => {
    expect(isUserProfileTransfersTab('/@alice/transfers')).toBe(true);
    expect(isUserProfileTransfersTab('/@alice/transfers/details')).toBe(true);
  });

  it('matches internal user-profile transfers URLs', () => {
    expect(isUserProfileTransfersTab('/user-profile/alice/transfers')).toBe(true);
    expect(isUserProfileTransfersTab('/user-profile/alice/transfers/details')).toBe(true);
  });

  it('does not match other profile tabs', () => {
    expect(isUserProfileTransfersTab('/@alice/activity')).toBe(false);
    expect(isUserProfileTransfersTab('/@alice')).toBe(false);
  });
});
