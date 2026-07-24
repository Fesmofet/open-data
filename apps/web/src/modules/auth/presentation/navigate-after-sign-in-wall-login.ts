'use client';

/**
 * Full document navigation after login on `/sign-in`.
 * Soft `router.push` + `router.refresh()` can race and leave the sign-in wall visible
 * while httpOnly cookies are already set (HiveSigner uses a server redirect instead).
 */
export function navigateAfterSignInWallLogin(): void {
  window.location.assign('/');
}
