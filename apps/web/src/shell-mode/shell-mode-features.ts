import type { ShellModeId } from './types';

/** Tailwind class: hide on desktop (lg+). Pairs with shell-mode CSS gated at 1024px. */
export const HIDDEN_ON_DESKTOP_CLASS = 'lg:hidden';

/**
 * Per-mode UI behavior for profile and feed. Centralizes mode checks so new
 * modes or renames require updates in one place.
 */

/** Twitter mode hides the profile/object hero band on desktop only. */
export function shouldHideHeroOnDesktop(mode: ShellModeId): boolean {
  return mode === 'twitter';
}

/**
 * Instagram mode uses a square post preview grid. Content-level — not viewport-gated.
 */
export function shouldUsePostGrid(mode: ShellModeId): boolean {
  return mode === 'instagram';
}

/**
 * When non-null, primary nav keys hidden on desktop only (see user-menu).
 * Mobile always shows the full nav set.
 */
export function getDesktopMenuKeys(mode: ShellModeId): Set<string> | null {
  if (mode === 'instagram') {
    return new Set<string>(['feed', 'transfers']);
  }
  return null;
}
