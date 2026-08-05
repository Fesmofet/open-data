/** Outer scrollport for single-row horizontal tab menus. */
export const HORIZONTAL_TAB_NAV_SCROLL_CLASS =
  'overflow-x-auto scrollbar-hide overscroll-x-contain';

/** Inner row: single line, no wrap. */
export const HORIZONTAL_TAB_NAV_ROW_CLASS =
  'flex flex-nowrap items-end gap-x-2';

/** Bleed scroll area to ShellInset gutter. */
export const HORIZONTAL_TAB_NAV_GUTTER_BLEED_CLASS =
  '-mx-gutter px-gutter sm:-mx-gutter-sm sm:px-gutter-sm';

/** Bleed inside card padding (profile submenu, object tab pane). */
export const HORIZONTAL_TAB_NAV_CARD_BLEED_CLASS =
  '-mx-card-padding px-card-padding';

/** Primary nav row (hero band, no bottom border). */
export const HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS = HORIZONTAL_TAB_NAV_ROW_CLASS;

/** Sub nav row with underline separator. */
export const HORIZONTAL_TAB_NAV_SUB_ROW_CLASS = `${HORIZONTAL_TAB_NAV_ROW_CLASS} border-b border-border`;

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
