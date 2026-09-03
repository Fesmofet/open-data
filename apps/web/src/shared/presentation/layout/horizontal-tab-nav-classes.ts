/** Outer scrollport for single-row horizontal tab menus. */
export const HORIZONTAL_TAB_NAV_SCROLL_CLASS =
  'overflow-x-auto overflow-y-hidden scrollbar-hide overscroll-x-contain touch-pan-x';

/** Inner row: single line, no wrap. */
export const HORIZONTAL_TAB_NAV_ROW_CLASS =
  'flex flex-nowrap items-end gap-x-2';

/** Bleed scroll area to ShellInset gutter. */
export const HORIZONTAL_TAB_NAV_GUTTER_BLEED_CLASS =
  '-mx-gutter px-gutter sm:-mx-gutter-sm sm:px-gutter-sm';

/** Bleed inside card padding (profile submenu, object tab pane). */
export const HORIZONTAL_TAB_NAV_CARD_BLEED_CLASS =
  '-mx-card-padding px-card-padding';

/** Primary nav row (hero band; transparent border absorbs tab -mb-px). */
export const HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS = `${HORIZONTAL_TAB_NAV_ROW_CLASS} border-b border-transparent`;

/** Sub nav row with underline separator. */
export const HORIZONTAL_TAB_NAV_SUB_ROW_CLASS = `${HORIZONTAL_TAB_NAV_ROW_CLASS} border-b border-border`;

/** Clip row: flex-wrap + max-height hides overflow tabs on line 2+. */
export const HORIZONTAL_TAB_NAV_CLIP_ROW_CLASS =
  'horizontal-tab-clip-row flex flex-wrap items-end overflow-hidden';

export function horizontalTabNavScrollShellClass(
  bleed: 'gutter' | 'card' | 'none' = 'gutter',
): string {
  const bleedClass =
    bleed === 'gutter'
      ? HORIZONTAL_TAB_NAV_GUTTER_BLEED_CLASS
      : bleed === 'card'
        ? HORIZONTAL_TAB_NAV_CARD_BLEED_CLASS
        : '';

  return [HORIZONTAL_TAB_NAV_SCROLL_CLASS, bleedClass].filter(Boolean).join(' ');
}

/** Gutter/card bleed without horizontal scroll — for overflow-measured tab rows. */
export function horizontalTabNavOverflowShellClass(
  bleed: 'gutter' | 'card' | 'none' = 'gutter',
): string {
  const bleedClass =
    bleed === 'gutter'
      ? HORIZONTAL_TAB_NAV_GUTTER_BLEED_CLASS
      : bleed === 'card'
        ? HORIZONTAL_TAB_NAV_CARD_BLEED_CLASS
        : '';

  return ['min-w-0', bleedClass].filter(Boolean).join(' ');
}
