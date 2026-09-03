'use client';

import type { ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/icons';

const DRAG_THRESHOLD_PX = 4;
const SCROLL_EDGE_EPSILON = 1;

export type ScrollableHorizontalTabNavProps = {
  children: ReactNode;
  ariaLabel: string;
  rowClass: string;
  bleed?: 'gutter' | 'card' | 'none';
  className?: string;
  centerWhenNoOverflow?: boolean;
  /** When set, scrolls the active tab into view on mount and when this value changes. */
  activeItemSelector?: string;
  scrollPrevAriaLabel?: string;
  scrollNextAriaLabel?: string;
};

type ScrollOverflowState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  hasOverflow: boolean;
};

function measureScrollOverflow(element: HTMLElement): ScrollOverflowState {
  const { scrollLeft, clientWidth, scrollWidth } = element;
  const hasOverflow = scrollWidth > clientWidth + SCROLL_EDGE_EPSILON;
  return {
    hasOverflow,
    canScrollLeft: scrollLeft > SCROLL_EDGE_EPSILON,
    canScrollRight: scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE_EPSILON,
  };
}

export function ScrollableHorizontalTabNav({
  children,
  ariaLabel,
  rowClass,
  bleed = 'gutter',
  className,
  centerWhenNoOverflow = false,
  activeItemSelector,
  scrollPrevAriaLabel = 'Scroll tabs left',
  scrollNextAriaLabel = 'Scroll tabs right',
}: ScrollableHorizontalTabNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    isDragging: boolean;
  } | null>(null);

  const [overflow, setOverflow] = useState<ScrollOverflowState>({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });
  const [isGrabbing, setIsGrabbing] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setOverflow(measureScrollOverflow(el));
  }, []);

  useLayoutEffect(() => {
    updateOverflow();
  }, [updateOverflow, children]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateOverflow();
    });
    observer.observe(el);
    el.addEventListener('scroll', updateOverflow, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateOverflow);
    };
  }, [updateOverflow]);

  useEffect(() => {
    if (!activeItemSelector || !scrollRef.current) {
      return;
    }
    const container = scrollRef.current;
    const target = container.querySelector(activeItemSelector) as HTMLElement | null;
    if (container && target) {
      const targetLeft = target.offsetLeft;
      const targetRight = targetLeft + target.offsetWidth;
      if (targetLeft < container.scrollLeft) {
        container.scrollTo({ left: targetLeft, behavior: 'smooth' });
      } else if (targetRight > container.scrollLeft + container.clientWidth) {
        container.scrollTo({
          left: Math.max(0, targetRight - container.clientWidth),
          behavior: 'smooth',
        });
      }
    }
  }, [activeItemSelector, children]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const delta = Math.max(160, el.clientWidth * 0.6) * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(updateOverflow, 350);
  }, [updateOverflow]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      isDragging: false,
    };
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    const el = scrollRef.current;
    if (!state || !el || state.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - state.startX;
    if (!state.isDragging) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
        return;
      }
      state.isDragging = true;
      suppressClickRef.current = true;
      setIsGrabbing(true);
      el.setPointerCapture(event.pointerId);
    }

    el.scrollLeft = state.startScrollLeft - deltaX;
  }, []);

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    const el = scrollRef.current;
    if (!state || !el || state.pointerId !== event.pointerId) {
      return;
    }

    if (state.isDragging) {
      el.releasePointerCapture(event.pointerId);
      setIsGrabbing(false);
    }

    dragStateRef.current = null;
  }, []);

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  }, []);

  const hasSubBorder = rowClass.includes('border-border');

  const arrowButtonClass = [
    'inline-flex w-7 sm:w-8 shrink-0 items-center justify-center self-stretch transition-colors',
    'text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-20',
    hasSubBorder ? 'border-b border-border' : 'border-b border-transparent',
  ].join(' ');

  const bleedClass =
    overflow.hasOverflow
      ? bleed === 'gutter'
        ? '-mx-gutter sm:-mx-gutter-sm'
        : bleed === 'card'
          ? '-mx-card-padding'
          : ''
      : '';

  const effectiveRowClass = [
    rowClass,
    centerWhenNoOverflow && !overflow.hasOverflow ? 'justify-center' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={[
        'flex min-w-0 items-center',
        bleedClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {overflow.hasOverflow ? (
        <button
          type="button"
          className={arrowButtonClass}
          aria-label={scrollPrevAriaLabel}
          disabled={!overflow.canScrollLeft}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeftIcon size={18} strokeWidth={2.5} />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className={[
          'min-w-0 flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide overscroll-x-contain touch-pan-x',
          isGrabbing ? 'cursor-grabbing select-none' : 'cursor-grab',
        ].join(' ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
      >
        <nav className={effectiveRowClass} aria-label={ariaLabel}>
          {children}
        </nav>
      </div>

      {overflow.hasOverflow ? (
        <button
          type="button"
          className={arrowButtonClass}
          aria-label={scrollNextAriaLabel}
          disabled={!overflow.canScrollRight}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRightIcon size={18} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
