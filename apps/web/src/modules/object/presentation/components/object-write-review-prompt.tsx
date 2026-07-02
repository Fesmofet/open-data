'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { appendAttachObjectToEditorPath } from '@/modules/editor/domain/post-editor-object-create-return';

export type ObjectWriteReviewPromptProps = {
  objectId: string;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
};

const promptClassName =
  'mb-2 flex w-full items-center gap-3 rounded-card border border-border bg-surface/60 p-card-padding text-left transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const plusIconClassName =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-pill border border-accent text-accent';

function WriteReviewPlusIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ObjectWriteReviewPrompt({
  objectId,
  viewerUsername = null,
  onRequireLogin,
}: ObjectWriteReviewPromptProps) {
  const { t } = useI18n();
  const href = appendAttachObjectToEditorPath('/editor', objectId);
  const isLoggedIn = (viewerUsername?.trim() ?? '') !== '';

  const label = (
    <>
      <span className={plusIconClassName} aria-hidden>
        <WriteReviewPlusIcon />
      </span>
      <span className="text-body-sm font-weight-label text-fg">{t('write_new_review')}</span>
    </>
  );

  if (!isLoggedIn) {
    return (
      <button type="button" onClick={() => onRequireLogin?.()} className={promptClassName}>
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={promptClassName}>
      {label}
    </Link>
  );
}
