const MESSAGING_VIEWPORT_HEIGHT_CLASS =
  'h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem))] max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem))]';

const MESSAGING_CENTER_VIEWPORT_HEIGHT_CLASS =
  'h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem)-var(--shell-messaging-submenu-chrome,4.5rem))] max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-var(--shell-messaging-rail-chrome,20.5rem)-var(--shell-messaging-submenu-chrome,4.5rem))]';

/** Side rails (profile left list, profile right About): top-aligned with grid row. */
export const MESSAGING_VIEWPORT_SHELL_CLASS = [
  'flex min-h-0 flex-col overflow-hidden',
  MESSAGING_VIEWPORT_HEIGHT_CLASS,
].join(' ');

/** Center chat column: below Posts submenu in profile/object feed column. */
export const MESSAGING_CENTER_VIEWPORT_SHELL_CLASS = [
  'flex min-h-0 flex-col overflow-hidden',
  MESSAGING_CENTER_VIEWPORT_HEIGHT_CLASS,
].join(' ');

/** Card shell inside viewport wrapper (list rail, about rail). */
export const MESSAGING_CARD_SHELL_CLASS =
  'flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-border bg-bg';

/** Horizontal messenger card (list + chat + optional about). */
export const MESSAGING_LAYOUT_CARD_CLASS =
  'flex h-full min-h-0 flex-row overflow-hidden rounded-card border border-border bg-bg';
