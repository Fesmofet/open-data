'use client';

import type { ReactNode } from 'react';

export type StatHoverTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  /** Disable hover popup (e.g. touch devices). */
  disabled?: boolean;
  className?: string;
};

export function StatHoverTooltip({
  content,
  children,
  disabled = false,
  className,
}: StatHoverTooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  const tooltipText = typeof content === 'string' ? content : undefined;

  return (
    <span
      className={['group/stat relative inline-flex max-w-full', className ?? ''].join(' ')}
      title={tooltipText}
      aria-label={tooltipText}
    >
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 opacity-0 transition-opacity group-hover/stat:opacity-100 group-focus-within/stat:opacity-100"
        role="tooltip"
      >
        <span className="block rounded-card border border-border bg-surface-raised px-3 py-2 text-body-sm text-fg shadow-card-float">
          {content}
        </span>
        <span
          className="mx-auto block h-2 w-2 rotate-45 border-b border-r border-border bg-surface-raised"
          aria-hidden
        />
      </span>
    </span>
  );
}
