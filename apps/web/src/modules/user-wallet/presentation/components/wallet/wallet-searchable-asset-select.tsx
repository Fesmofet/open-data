'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { APP_MODAL_Z_INDEX } from '@/shared/presentation';

import { formatWalletModalBalanceDisplay } from '../../../domain/wallet-modal-format';
import { ChevronDownIcon } from '@/icons';
import type { WalletAssetAmountOption } from './wallet-asset-amount-field';

const DROPDOWN_GAP_PX = 4;
const MENU_MIN_WIDTH_PX = 220;

type DropdownRect = {
  top: number;
  right: number;
  minWidth: number;
};

function measureMenuRect(button: HTMLButtonElement): DropdownRect {
  const rect = button.getBoundingClientRect();
  return {
    top: rect.bottom + DROPDOWN_GAP_PX,
    right: window.innerWidth - rect.right,
    minWidth: Math.max(MENU_MIN_WIDTH_PX, rect.width + 80),
  };
}

function matchesAssetQuery(option: WalletAssetAmountOption<string>, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    option.value.toLowerCase().includes(normalized) ||
    option.label.toLowerCase().includes(normalized)
  );
}

export type WalletSearchableAssetSelectProps<T extends string> = {
  value: T;
  options: WalletAssetAmountOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
  showBalanceInMenu?: boolean;
  showLabelOnTrigger?: boolean;
};

export function WalletSearchableAssetSelect<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  showBalanceInMenu = true,
  showLabelOnTrigger = false,
}: WalletSearchableAssetSelectProps<T>) {
  const { t } = useI18n();
  const listboxId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const filteredOptions = useMemo(
    () => options.filter((option) => matchesAssetQuery(option, query)),
    [options, query],
  );

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setDropdownRect(null);
      return;
    }
    setDropdownRect(measureMenuRect(buttonRef.current));
  }, [open, options.length]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) {
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
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pickOption = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
  };

  const menu =
    open && dropdownRect && portalReady
      ? createPortal(
          <div
            ref={menuRef}
            className="rounded-card border border-border bg-surface shadow-card-float"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              right: dropdownRect.right,
              minWidth: dropdownRect.minWidth,
              zIndex: APP_MODAL_Z_INDEX + 10,
            }}
          >
            <div className="border-b border-border p-2">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full rounded-btn border border-border bg-bg px-2 py-1.5 text-body-sm text-fg outline-none focus:ring-1 focus:ring-accent"
                autoComplete="off"
                aria-controls={listboxId}
              />
            </div>
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-60 overflow-y-auto py-1"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-body-sm text-muted">{t('search_empty_state')}</li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option.value} role="option" aria-selected={option.value === value}>
                    <button
                      type="button"
                      className={[
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-body-sm',
                        option.value === value
                          ? 'bg-ghost-surface font-weight-strong text-fg'
                          : 'text-fg hover:bg-ghost-surface',
                      ].join(' ')}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickOption(option.value)}
                    >
                      <span>{option.label}</span>
                      {showBalanceInMenu ? (
                        <span className="text-caption text-muted">
                          {formatWalletModalBalanceDisplay(option.balance)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex max-w-[9rem] shrink-0 items-center gap-1 border-0 border-l border-border bg-surface py-2 pl-2 pr-1.5 text-body-sm text-fg outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || options.length === 0}
        onClick={() => {
          if (disabled || options.length === 0) {
            return;
          }
          setOpen((current) => !current);
        }}
      >
        <span className="min-w-0 truncate">
          {showLabelOnTrigger
            ? (selected?.label ?? value) || '…'
            : (selected?.value ?? value) || '…'}
        </span>
        <ChevronDownIcon size={14} className="shrink-0 text-muted" />
      </button>
      {menu}
    </>
  );
}
