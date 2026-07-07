'use client';

export type AppLoaderProps = {
  /** Visible loading text; also used as the accessible name when set. */
  label?: string;
  size?: 'sm' | 'md';
  /** `center` stacks spinner + label for modal bodies; `inline` is a horizontal row. */
  layout?: 'inline' | 'center';
  className?: string;
};

const SPINNER_SIZE_CLASS = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
} as const;

export function AppLoader({
  label,
  size = 'md',
  layout = 'inline',
  className = '',
}: AppLoaderProps) {
  const spinner = (
    <span
      className={`inline-block animate-spin rounded-circle border-border border-t-accent ${SPINNER_SIZE_CLASS[size]}`}
      aria-hidden
    />
  );

  const rootClass =
    layout === 'center'
      ? ['flex flex-col items-center justify-center gap-3 py-8', className]
          .filter(Boolean)
          .join(' ')
      : ['flex items-center gap-2', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
    >
      {spinner}
      {label ? <span className="text-body-sm text-muted">{label}</span> : null}
    </div>
  );
}
