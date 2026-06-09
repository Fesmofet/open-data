'use client';

import type { ReactNode } from 'react';

export type StoryStatButtonProps = {
  icon: ReactNode;
  count?: number;
  label: string;
  title?: string | null;
  /** Accent icon when `true`; default muted. */
  iconActive?: boolean;
  /** Muted icon that turns accent on button hover (e.g. comment control). */
  iconHoverAccent?: boolean;
  countAccent?: boolean;
  ariaPressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function StoryStatButton({
  icon,
  count,
  label,
  title,
  iconActive,
  iconHoverAccent,
  countAccent,
  ariaPressed,
  disabled = false,
  onClick,
}: StoryStatButtonProps) {
  const showCount = count != null;
  const iconToneClass =
    iconActive === true
      ? 'text-accent'
      : iconHoverAccent
        ? 'text-muted transition-colors group-hover:text-accent'
        : 'text-muted';
  const countClass =
    countAccent === true
      ? 'font-weight-label tabular-nums text-accent'
      : 'font-weight-label tabular-nums text-fg-secondary';
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center gap-1.5 rounded-btn px-1 py-1 text-caption text-muted transition-colors hover:bg-surface-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50',
        iconHoverAccent ? 'group' : 'hover:text-fg-secondary',
      ].join(' ')}
      disabled={disabled}
      aria-label={label}
      title={title ?? undefined}
      aria-pressed={ariaPressed}
      onClick={onClick}
    >
      <span className={iconToneClass}>{icon}</span>
      {showCount ? <span className={countClass}>{count}</span> : null}
    </button>
  );
}
