'use client';

import type { ReactNode } from 'react';

import { LexicalPostEditor } from './lexical-editor';

export type CompactComposeEditorProps = {
  bodyPlaceholder: string;
  onBodyChange: (body: string) => void;
  onSend: () => void | Promise<void>;
  canSend: boolean;
  sendAriaLabel: string;
  /** Orange send (activity/messaging) vs neutral chevron (comments). */
  sendVariant?: 'accent' | 'neutral';
  editorKey?: number;
  /** Plain text for Hive comments; lexical JSON for OSL/messaging markdown. */
  outputMode?: 'plain' | 'lexical';
  className?: string;
  footer?: ReactNode;
};

function IconSendChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconSendArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/**
 * Shared feed compose — same shell as {@link StoryCommentEditor}:
 * (+) straddles the left edge, send overlaid on the right.
 * `pl-5` reserves half the insert button inside FeedColumn (`overflow-x-clip`).
 */
export function CompactComposeEditor({
  bodyPlaceholder,
  onBodyChange,
  onSend,
  canSend,
  sendAriaLabel,
  sendVariant = 'neutral',
  editorKey = 0,
  outputMode = 'plain',
  className = '',
  footer,
}: CompactComposeEditorProps) {
  const accentSend = sendVariant === 'accent';

  return (
    <div className={className}>
      <div className="relative pl-5">
        <LexicalPostEditor
          key={editorKey}
          compact
          compactBottomInset
          messagingCompact={outputMode === 'lexical'}
          bodyPlaceholder={bodyPlaceholder}
          onBodyChange={onBodyChange}
        />
        <div className="pointer-events-none absolute end-2 top-1/2 z-[65] -translate-y-1/2">
          <button
            type="button"
            onClick={() => void onSend()}
            disabled={!canSend}
            aria-label={sendAriaLabel}
            className={[
              'pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-circle',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              'disabled:cursor-not-allowed disabled:opacity-50',
              accentSend
                ? 'bg-accent text-accent-fg'
                : 'border border-border bg-bg text-fg-secondary shadow-none hover:bg-ghost-surface',
            ].join(' ')}
          >
            {accentSend ? <IconSendArrow className="size-5" /> : <IconSendChevron />}
          </button>
        </div>
      </div>
      {footer}
    </div>
  );
}
