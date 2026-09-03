'use client';

import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ChevronDownIcon } from '@/icons';

export type SortOption<T extends string> = {
  value: T;
  label: string;
};

export type SortDropdownProps<T extends string> = {
  value: T;
  options: SortOption<T>[];
  onChange: (next: T) => void;
  /** Override default `social_sort_by` prefix label. */
  label?: string;
  /** When true, show the prefix label on all viewports (not only `sm+`). */
  showLabelOnMobile?: boolean;
};

export function SortDropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  showLabelOnMobile = false,
}: SortDropdownProps<T>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;
  const prefixLabel = label ?? t('social_sort_by');
  const prefixClassName = showLabelOnMobile ? 'inline' : 'hidden sm:inline';

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-body-sm text-fg-secondary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span className={prefixClassName}>{prefixLabel}&nbsp;</span>
        <span className="font-weight-label text-fg">{currentLabel}</span>
        <ChevronDownIcon
          size={12}
          className={`ml-0.5 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={prefixLabel}
          className="absolute right-0 top-full z-20 mt-1 min-w-[9rem] overflow-hidden rounded-card border border-border bg-surface-raised shadow-card-float"
        >
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2.5 text-body-sm transition-colors hover:bg-surface-alt ${
                o.value === value ? 'font-weight-label text-fg' : 'text-fg-secondary'
              }`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
