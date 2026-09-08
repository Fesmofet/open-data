'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { APP_MODAL_Z_INDEX } from '@/shared/presentation/components/app-modal';

const TOOLTIP_Z_INDEX = APP_MODAL_Z_INDEX + 10;
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 8;

export type WalletHoverTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  /** Disable hover popup (e.g. touch devices). */
  disabled?: boolean;
  placement?: 'top' | 'bottom';
  align?: 'center' | 'start';
  className?: string;
};

export function WalletHoverTooltip({
  content,
  children,
  disabled = false,
  placement = 'top',
  align = 'start',
  className,
}: WalletHoverTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let left =
      align === 'start'
        ? triggerRect.left
        : triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(left, viewportWidth - tooltipRect.width - VIEWPORT_MARGIN_PX),
    );

    const top =
      placement === 'bottom'
        ? triggerRect.bottom + GAP_PX
        : triggerRect.top - GAP_PX - tooltipRect.height;

    setCoords({ top, left });
  }, [align, placement]);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setCoords(null);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition, visible]);

  if (disabled) {
    return <>{children}</>;
  }

  const isBottom = placement === 'bottom';
  const arrowClass = align === 'start' ? 'ms-4' : 'mx-auto';

  const tooltipNode =
    visible && mounted
      ? createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed w-max max-w-[min(18rem,calc(100vw-2rem))]"
            style={{
              zIndex: TOOLTIP_Z_INDEX,
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? 'visible' : 'hidden',
            }}
          >
            {isBottom ? (
              <span
                className={[
                  '-mb-1 block h-2 w-2 rotate-45 border-l border-t border-border bg-surface-raised',
                  arrowClass,
                ].join(' ')}
                aria-hidden
              />
            ) : null}
            <span className="block rounded-card border border-border bg-surface-raised px-3 py-2 text-body-sm text-fg shadow-card-float">
              {content}
            </span>
            {!isBottom ? (
              <span
                className={[
                  '-mt-1 block h-2 w-2 rotate-45 border-b border-r border-border bg-surface-raised',
                  arrowClass,
                ].join(' ')}
                aria-hidden
              />
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={['inline-flex max-w-full cursor-help', className ?? ''].join(' ')}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {tooltipNode}
    </>
  );
}
