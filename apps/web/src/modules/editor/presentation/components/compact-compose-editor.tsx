'use client';

import type { ReactNode } from 'react';

import { ChevronRightIcon, SendHorizontalIcon } from '@/icons';
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
  enableOriginalCreatedAt?: boolean;
  insertPanelPreferBelow?: boolean;
  renderOriginalDatePicker?: (props: { onSelect: (unix: number) => void }) => ReactNode;
  onOriginalCreatedAtSelected?: (unix: number) => void;
};

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
  enableOriginalCreatedAt,
  insertPanelPreferBelow,
  renderOriginalDatePicker,
  onOriginalCreatedAtSelected,
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
          enableOriginalCreatedAt={enableOriginalCreatedAt}
          insertPanelPreferBelow={insertPanelPreferBelow}
          renderOriginalDatePicker={renderOriginalDatePicker}
          onOriginalCreatedAtSelected={onOriginalCreatedAtSelected}
        />
        <div className="pointer-events-none absolute end-2 top-1/2 z-[65] -translate-y-1/2">
          <button
            type="button"
            onClick={() => void onSend()}
            disabled={!canSend}
            aria-label={sendAriaLabel}
            className={[
              'pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-circle leading-none',
              '[&_svg]:block',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              'disabled:cursor-not-allowed disabled:opacity-50',
              accentSend
                ? 'bg-accent text-accent-fg'
                : 'border border-border bg-bg text-fg-secondary shadow-none hover:bg-ghost-surface',
            ].join(' ')}
          >
            {accentSend ? (
              <SendHorizontalIcon size={20} />
            ) : (
              <ChevronRightIcon size={20} className="block shrink-0" />
            )}
          </button>
        </div>
      </div>
      {footer}
    </div>
  );
}
