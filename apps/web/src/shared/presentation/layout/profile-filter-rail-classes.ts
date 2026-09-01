/**
 * Sticky profile side-rail panels (lg+); offset clears the app header.
 *
 * `overflow-x-hidden` is required with `overflow-y-auto`: CSS treats the other
 * axis as `auto` as well, and Windows classic scrollbars (~17px) then create a
 * horizontal bar. Overlay scrollbars (Chrome device mode) hide that.
 */
export const PROFILE_RAIL_STICKY_CLASS =
  'relative z-0 min-w-0 w-full self-start lg:sticky lg:top-[calc(var(--shell-header-height,3.5rem)+1rem)] lg:max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-2rem)] lg:overflow-y-auto lg:overflow-x-hidden scrollbar-minimal';

/** @deprecated Use {@link PROFILE_RAIL_STICKY_CLASS}. */
export const PROFILE_FILTER_RAIL_STICKY_CLASS = PROFILE_RAIL_STICKY_CLASS;
