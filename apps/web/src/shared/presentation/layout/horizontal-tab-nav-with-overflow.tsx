'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { ChevronDownIcon } from '@/icons';

import { profileSectionTabClass } from '../components/profile-section-tab-classes';
import {
  HORIZONTAL_TAB_NAV_CLIP_ROW_CLASS,
  horizontalTabNavOverflowShellClass,
} from './horizontal-tab-nav-classes';
import { useHorizontalTabOverflow } from './use-horizontal-tab-overflow';

export type HorizontalTabNavItem = {
  id: string;
  active: boolean;
  label: ReactNode;
  onSelect: () => void;
};

export type HorizontalTabNavWithOverflowProps = {
  items: HorizontalTabNavItem[];
  activeIndex: number;
  ariaLabel: string;
  moreLabel: string;
  moreMenuAriaLabel: string;
  bleed?: 'gutter' | 'card' | 'none';
  rowClassName?: string;
};

export function HorizontalTabNavWithOverflow({
  items,
  activeIndex: _activeIndex,
  ariaLabel,
  moreLabel,
  moreMenuAriaLabel,
  bleed = 'gutter',
  rowClassName,
}: HorizontalTabNavWithOverflowProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { rowRef, setTabRef, overflowIndices, hasOverflow, hasMeasured } =
    useHorizontalTabOverflow({
      tabCount: items.length,
    });

  const overflowSet = new Set(overflowIndices);
  /** Mobile: show More on first paint (CSS clips tabs). Desktop: only after measure confirms overflow. */
  const showMoreMobile = !hasMeasured || hasOverflow;
  const showMoreDesktop = hasMeasured && hasOverflow;
  const overflowHasActive = overflowIndices.some(
    (index) => items[index]?.active === true,
  );

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onDocPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        moreTriggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const shellClass = horizontalTabNavOverflowShellClass(bleed);

  return (
    <div className={[shellClass, 'relative z-[60]'].join(' ')}>
      <div className="relative min-w-0 w-full">
        <nav
          aria-label={ariaLabel}
          className="flex w-full items-end border-b border-border"
        >
          <div className="flex min-w-0 flex-1 justify-center">
            <div
              ref={rowRef}
              className={[HORIZONTAL_TAB_NAV_CLIP_ROW_CLASS, rowClassName]
                .filter(Boolean)
                .join(' ')}
            >
              {items.map((item, index) => {
                const isOverflowed = overflowSet.has(index);
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      setTabRef(index, node);
                    }}
                    type="button"
                    tabIndex={isOverflowed ? -1 : undefined}
                    aria-hidden={isOverflowed ? true : undefined}
                    className={profileSectionTabClass(item.active, 'primary')}
                    onClick={() => {
                      setMenuOpen(false);
                      item.onSelect();
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={rootRef}
            className={[
              'relative shrink-0',
              showMoreMobile ? 'max-lg:block' : 'max-lg:hidden',
              showMoreDesktop ? 'lg:block' : 'lg:hidden',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              ref={moreTriggerRef}
              type="button"
              id={`${menuId}-trigger`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? `${menuId}-menu` : undefined}
              aria-label={moreMenuAriaLabel}
              tabIndex={showMoreDesktop || showMoreMobile ? undefined : -1}
              className={[
                profileSectionTabClass(overflowHasActive, 'primary'),
                'inline-flex items-center gap-1',
              ].join(' ')}
              onClick={() => {
                setMenuOpen((open) => !open);
              }}
            >
              <span>{moreLabel}</span>
              <ChevronDownIcon size={14} />
            </button>

            {menuOpen && hasOverflow ? (
              <div
                id={`${menuId}-menu`}
                role="menu"
                aria-labelledby={`${menuId}-trigger`}
                className="absolute end-0 top-full z-[60] mt-1 min-w-[12rem] overflow-hidden rounded-card border border-border bg-surface py-1 shadow-card"
              >
                {overflowIndices.map((index) => {
                  const item = items[index];
                  if (!item) {
                    return null;
                  }
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      className={[
                        'flex w-full items-center px-3 py-2 text-start text-body transition-colors',
                        item.active
                          ? 'font-weight-strong text-accent'
                          : 'text-fg-tertiary hover:bg-surface/80 hover:text-fg',
                      ].join(' ')}
                      onClick={() => {
                        setMenuOpen(false);
                        item.onSelect();
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </div>
  );
}
