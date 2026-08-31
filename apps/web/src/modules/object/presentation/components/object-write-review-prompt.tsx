'use client';

import Link from 'next/link';

import { PencilIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { appendAttachObjectToEditorPath } from '@/modules/editor/domain/post-editor-object-create-return';

export type ObjectWriteReviewPromptProps = {
  objectId: string;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
};

const promptClassName =
  'mb-2 flex w-full items-center gap-3 rounded-card border border-border bg-surface/60 p-card-padding text-left transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const penIconClassName =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-pill border border-accent text-accent';

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
      <span className={penIconClassName} aria-hidden>
        <PencilIcon size={20} />
      </span>
      <span className="text-body-sm font-weight-label text-fg">{t('write_review')}</span>
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
    <Link href={href} className={promptClassName} suppressHydrationWarning>
      {label}
    </Link>
  );
}
