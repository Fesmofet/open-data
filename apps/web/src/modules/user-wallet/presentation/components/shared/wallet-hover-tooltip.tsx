'use client';

import type { ReactNode } from 'react';

export type WalletHoverTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  /** Disable hover popup (e.g. touch devices). */
  disabled?: boolean;
};

export function WalletHoverTooltip({
  content,
  children,
  disabled = false,
}: WalletHoverTooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <span className="group relative inline-flex max-w-full">
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
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
