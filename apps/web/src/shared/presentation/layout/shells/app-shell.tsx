import type { ReactNode } from 'react';

export type AppShellProps = {
  header?: ReactNode;
  leftNav?: ReactNode;
  rightRail?: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
  /** When set, replaces auto-derived `lg:` grid columns (Tailwind arbitrary value, e.g. `lg:grid-cols-1`). */
  gridTemplateClassName?: string;
  /** Extra class on the outer page wrapper (e.g. vertical padding). */
  className?: string;
  /** Scroll-away top inset above header (default false). */
  headerTopInset?: boolean;
};

/** Exported for unit tests and tooling. */
export function gridClassForSlots(
  hasLeft: boolean,
  hasRight: boolean,
): string {
  if (hasLeft && hasRight) {
    return 'lg:grid-cols-[minmax(0,var(--shell-left-width))_minmax(0,1fr)_minmax(0,var(--shell-right-width))]';
  }
  if (hasLeft && !hasRight) {
    return 'lg:grid-cols-[minmax(0,var(--shell-left-width))_minmax(0,1fr)]';
  }
  if (!hasLeft && hasRight) {
    return 'lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--shell-right-width))]';
  }
  return 'lg:grid-cols-1';
}

/**
 * App chrome: optional header, three-zone main row (left / main / right), optional bottom nav.
 * Uses design tokens `--shell-left-width` / `--shell-right-width` at `lg+`.
 */
export function AppShell({
  header,
  leftNav,
  rightRail,
  bottomNav,
  children,
  gridTemplateClassName,
  className = '',
  headerTopInset,
}: AppShellProps) {
  const hasLeft = Boolean(leftNav);
  const hasRight = Boolean(rightRail);
  const gridClass =
    gridTemplateClassName ?? gridClassForSlots(hasLeft, hasRight);
  const showHeaderTopInset = headerTopInset === true;

  return (
    <>
      {header ? (
        <>
          {showHeaderTopInset ? (
            <div className="pt-section-y-sm" aria-hidden />
          ) : null}
          <div className="sticky top-0 z-40 w-full">{header}</div>
        </>
      ) : null}
      <div
        className={['mx-auto max-w-container-page px-gutter sm:px-gutter-sm', className].join(
          ' ',
        )}
      >
        <div
          className={[
            'grid grid-cols-1 gap-card-padding',
            gridClass,
          ].join(' ')}
        >
          {leftNav}
          <div className="min-h-[12rem] min-w-0">{children}</div>
          {rightRail}
        </div>
        {bottomNav}
      </div>
    </>
  );
}
