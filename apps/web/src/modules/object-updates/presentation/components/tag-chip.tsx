'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';

export type TagChipProps = {
  label: string;
  /** Dashed empty compose pill */
  empty?: boolean;
  /** Inline text input inside the pill */
  editing?: boolean;
  editValue?: string;
  onEditValueChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
  composePlaceholder?: string;
  viewerVote?: 'for' | 'against' | null;
  disabled?: boolean;
  /** Vote mode: click label approves */
  onApprove?: () => void;
  onReject?: () => void;
  /** Compose / create: click label toggles edit */
  onClick?: () => void;
  approveAria?: string;
  rejectAria?: string;
};

export function TagChip({
  label,
  empty = false,
  editing = false,
  editValue = '',
  onEditValueChange,
  onEditSubmit,
  onEditCancel,
  composePlaceholder,
  viewerVote = null,
  disabled = false,
  onApprove,
  onReject,
  onClick,
  approveAria,
  rejectAria,
}: TagChipProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const voteMode = onApprove != null;
  const approved = viewerVote === 'for' && !empty && !editing;

  const shellClass = [
    'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-body-sm',
    empty || editing
      ? 'border-dashed border-border-strong text-muted'
      : approved
        ? 'border-accent bg-ghost-surface text-fg'
        : 'border-border bg-ghost-surface text-fg',
    disabled ? 'opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleLabelClick = () => {
    if (disabled) {
      return;
    }
    if (voteMode && onApprove) {
      onApprove();
      return;
    }
    onClick?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onEditSubmit?.();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onEditCancel?.();
    }
  };

  return (
    <span className={shellClass}>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          disabled={disabled}
          placeholder={composePlaceholder}
          className="min-w-[4rem] max-w-[12rem] bg-transparent text-body-sm text-fg outline-none placeholder:text-muted"
          onChange={(event) => onEditValueChange?.(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (editValue.trim().length > 0) {
              onEditSubmit?.();
            } else {
              onEditCancel?.();
            }
          }}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          className="hover:text-accent disabled:cursor-not-allowed"
          aria-label={voteMode ? approveAria : undefined}
          onClick={handleLabelClick}
        >
          {label}
        </button>
      )}
      {onReject && !editing ? (
        <button
          type="button"
          disabled={disabled}
          className="text-caption text-muted hover:text-accent disabled:cursor-not-allowed"
          aria-label={rejectAria}
          onClick={onReject}
        >
          ×
        </button>
      ) : null}
      {editing ? (
        <button
          type="button"
          disabled={disabled}
          className="text-caption text-muted hover:text-accent"
          aria-label={rejectAria}
          onClick={onEditCancel}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
