import type { ReactNode } from 'react';

export type ShellInsetProps = {
  children: ReactNode;
  className?: string;
};

/** Constrained app column: `max-w-container-page` + horizontal gutters. */
export function ShellInset({ children, className = '' }: ShellInsetProps) {
  return (
    <div
      className={[
        'mx-auto w-full max-w-container-page px-gutter sm:px-gutter-sm',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
