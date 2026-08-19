const MESSAGING_VIEWPORT_HEIGHT_CLASS =
  'h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem))] max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem))]';

const MESSAGING_CENTER_VIEWPORT_HEIGHT_CLASS =
  'h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem)-var(--shell-messaging-submenu-chrome,4.5rem))] max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem)-var(--shell-messaging-submenu-chrome,4.5rem))]';

/** Side rails (object pages / standalone): top-aligned with grid row. */
export const MESSAGING_VIEWPORT_SHELL_CLASS = [
  'flex min-h-0 flex-col overflow-hidden',
  MESSAGING_VIEWPORT_HEIGHT_CLASS,
].join(' ');

/** Center chat column: below Posts submenu in profile/object feed column. */
export const MESSAGING_CENTER_VIEWPORT_SHELL_CLASS = [
  'flex min-h-0 flex-col overflow-hidden',
  MESSAGING_CENTER_VIEWPORT_HEIGHT_CLASS,
].join(' ');

/**
 * Profile messages left/right rails: full grid-column height (top-aligned with center
 * column; center chat sits below submenu + feed gap inside the same total span).
 */
export const MESSAGING_PROFILE_SIDE_RAIL_SHELL_CLASS = MESSAGING_VIEWPORT_SHELL_CLASS;

/** Card shell inside viewport wrapper (list rail, about rail). */
export const MESSAGING_CARD_SHELL_CLASS =
  'flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-border bg-bg';

/** Shared footer shell — aligns border-t across profile messaging columns (match compose bar). */
export const MESSAGING_COLUMN_FOOTER_SHELL_CLASS =
  'shrink-0 border-t border-border bg-bg px-4 py-3';

/** Inner row height inside column footers (matches compose textarea min height). */
export const MESSAGING_COLUMN_FOOTER_INNER_CLASS = 'flex min-h-[2.5rem] w-full items-center';

/** Horizontal messenger card (list + chat + optional about). */
export const MESSAGING_LAYOUT_CARD_CLASS =
  'flex h-full min-h-0 flex-row overflow-hidden rounded-card border border-border bg-bg';
