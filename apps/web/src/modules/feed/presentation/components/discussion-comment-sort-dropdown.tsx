'use client';

import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  DISCUSSION_COMMENT_SORTS,
  type DiscussionCommentSort,
} from '../../domain/sort-discussion-comments';

const SORT_I18N_KEYS: Record<DiscussionCommentSort, string> = {
  BEST: 'sort_best',
  NEWEST: 'sort_newest',
  OLDEST: 'sort_oldest',
  AUTHOR_REPUTATION: 'sort_author_reputation',
};

type DiscussionCommentSortDropdownProps = {
  value: DiscussionCommentSort;
  onChange: (next: DiscussionCommentSort) => void;
};

export function DiscussionCommentSortDropdown({
  value,
  onChange,
}: DiscussionCommentSortDropdownProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const currentLabel = t(SORT_I18N_KEYS[value]);

  return (
    <div ref={containerRef} className="relative inline-flex text-right">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center text-caption text-muted hover:text-fg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span>{t('sort_by')}&nbsp;</span>
        <span className="font-weight-label">{currentLabel}</span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`ml-1 shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t('sort_by')}
          className="absolute right-0 top-full z-20 mt-1 min-w-[9rem] overflow-hidden rounded-card border border-border bg-surface-raised shadow-card-float"
        >
          {DISCUSSION_COMMENT_SORTS.map((sortKey) => (
            <li
              key={sortKey}
              role="option"
              aria-selected={sortKey === value}
              onClick={() => {
                onChange(sortKey);
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2.5 text-body-sm transition-colors hover:bg-surface-alt ${
                sortKey === value ? 'font-weight-label text-fg' : 'text-fg-secondary'
              }`}
            >
              {t(SORT_I18N_KEYS[sortKey])}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
