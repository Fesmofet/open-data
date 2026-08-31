'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ChevronDownIcon } from '@/icons';

import { WalletHoverTooltip } from './wallet-hover-tooltip';

/** Above wallet summary cards (`overflow-hidden`) and page chrome; below app modals (~110). */
const WALLET_ACTION_MENU_Z_INDEX = 100;

const MENU_GAP_PX = 4;
const MENU_MIN_WIDTH_PX = 160;

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
  disabledTooltip?: string;
};

type MenuPosition = {
  top: number;
  right: number;
  minWidth: number;
};

function measureMenuPosition(anchor: HTMLElement): MenuPosition {
  const rect = anchor.getBoundingClientRect();
  return {
    top: rect.bottom + MENU_GAP_PX,
    right: window.innerWidth - rect.right,
    minWidth: Math.max(MENU_MIN_WIDTH_PX, rect.width),
  };
}

export function WalletActionSplit({
  primaryLabel,
  onPrimary,
  menuItems = [],
  disabled = false,
  disabledTooltip,
}: WalletActionSplitProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !menuAnchorRef.current) {
      setMenuPosition(null);
      return;
    }
    setMenuPosition(measureMenuPosition(menuAnchorRef.current));
  }, [open, menuItems.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const hasMenu = menuItems.length > 0;

  const primaryButton = (
    <button
      type="button"
      className="px-3 py-1.5 text-body-sm font-weight-label text-accent hover:bg-accent/10 disabled:opacity-50"
      onClick={onPrimary}
      disabled={disabled}
    >
      {primaryLabel}
    </button>
  );

  const menu =
    open && hasMenu && menuPosition && portalReady
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="rounded-btn border border-border bg-bg py-1 shadow-card"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              right: menuPosition.right,
              minWidth: menuPosition.minWidth,
              zIndex: WALLET_ACTION_MENU_Z_INDEX,
            }}
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <div
        ref={menuAnchorRef}
        className="inline-flex overflow-hidden rounded-btn border border-accent"
      >
        {disabled && disabledTooltip ? (
          <WalletHoverTooltip content={disabledTooltip}>{primaryButton}</WalletHoverTooltip>
        ) : (
          primaryButton
        )}
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
            <ChevronDownIcon size={12} className="mt-0.5" />
          </button>
        ) : null}
      </div>
      {menu}
    </div>
  );
}
