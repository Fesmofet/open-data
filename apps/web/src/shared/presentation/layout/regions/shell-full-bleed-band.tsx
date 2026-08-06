import type { ElementType, ReactNode } from 'react';

export type ShellFullBleedBandProps = {
  children: ReactNode;
  className?: string;
  /** When true (default), breaks out of a constrained parent to viewport width. */
  breakout?: boolean;
  as?: ElementType;
};

const BREAKOUT_CLASSES =
  'relative ms-[calc(50%-50dvw)] me-[calc(50%-50dvw)]';

/**
 * Full-viewport-width band (cover, hero background, chrome backdrop).
 * Use `breakout={false}` when already outside `max-w-container-page` (e.g. app header).
 */
export function ShellFullBleedBand({
  children,
  className = '',
  breakout = true,
  as: Component = 'div',
}: ShellFullBleedBandProps) {
  return (
    <Component
      className={[
        breakout ? BREAKOUT_CLASSES : 'relative w-full',
        className,
      ].join(' ')}
    >
      {children}
    </Component>
  );
}

/** Exported for unit tests. */
export const shellFullBleedBreakoutClassName = BREAKOUT_CLASSES;
