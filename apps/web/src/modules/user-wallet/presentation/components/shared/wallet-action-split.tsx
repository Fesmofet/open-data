'use client';

import { useEffect, useRef, useState } from 'react';

export type WalletActionSplitItem = {
  id: string;
  label: string;
  onSelect: () => void;
};

export type WalletActionSplitProps = {
  primaryLabel: string;
  onPrimary: () => void;
  menuItems?: WalletActionSplitItem[];
  disabled?: boolean;
};

export function WalletActionSplit({
  primaryLabel,
  onPrimary,
  menuItems = [],
  disabled = false,
}: WalletActionSplitProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const hasMenu = menuItems.length > 0;

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <div className="inline-flex overflow-hidden rounded-btn border border-accent">
        <button
          type="button"
          className="px-3 py-1.5 text-body-sm font-weight-label text-accent hover:bg-accent/10 disabled:opacity-50"
          onClick={onPrimary}
          disabled={disabled}
        >
          {primaryLabel}
        </button>
        {hasMenu ? (
          <button
            type="button"
            className="border-l border-accent px-2 py-1.5 text-accent hover:bg-accent/10 disabled:opacity-50"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
            disabled={disabled}
          >
            <span className="sr-only">{primaryLabel} menu</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden
              className="mt-0.5"
            >
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        ) : null}
      </div>
      {open && hasMenu ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-btn border border-border bg-bg py-1 shadow-card"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-body-sm text-fg hover:bg-muted/40"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
