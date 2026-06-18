/** Sticky profile side-rail panels (lg+); offset clears the app header. */
export const PROFILE_RAIL_STICKY_CLASS =
  'relative z-0 min-w-0 w-full self-start lg:sticky lg:top-[calc(var(--shell-header-height,3.5rem)+1rem)] lg:max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-2rem)] lg:overflow-y-auto';

/** @deprecated Use {@link PROFILE_RAIL_STICKY_CLASS}. */
export const PROFILE_FILTER_RAIL_STICKY_CLASS = PROFILE_RAIL_STICKY_CLASS;
