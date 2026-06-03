'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { EditorPublishPhase } from '../../application/use-editor-post-publish';

const NAV_BACKDROP_STYLE = { backdropFilter: 'var(--backdrop-nav)' } as const;

export type EditorPublishDockProps = {
  statusLine: string | null;
  statusWarning?: boolean;
  canPreview: boolean;
  canPublish: boolean;
  legalAccepted: boolean;
  onLegalAcceptedChange: (accepted: boolean) => void;
  publishPhase: EditorPublishPhase;
  busy: boolean;
  publishError: string | null;
  onPreview: () => void;
  onPublish: () => void;
};

export function EditorPublishDock({
  statusLine,
  statusWarning = false,
  canPreview,
  canPublish,
  legalAccepted,
  onLegalAcceptedChange,
  publishPhase,
  busy,
  publishError,
  onPreview,
  onPublish,
}: EditorPublishDockProps) {
  const { t } = useI18n();

  const publishLabel = (() => {
    if (publishPhase === 'confirming') {
      return t('object_create_confirming_on_chain');
    }
    if (publishPhase === 'publishing') {
      return t('object_create_publishing');
    }
    return t('editor_publish_post');
  })();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-gutter sm:px-gutter-sm"
      role="region"
      aria-label={t('editor_dock_region')}
    >
      <div
        className="w-full max-w-container-page border-t border-border bg-nav-bg"
        style={NAV_BACKDROP_STYLE}
      >
        <div className="flex min-h-shell-header flex-col gap-2 px-gutter py-2 sm:px-gutter-sm">
          {publishError ? (
            <p className="text-body-sm text-error" role="alert">
              {publishError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <div className="min-w-0 flex-1 space-y-2">
              {statusLine ? (
                <p
                  className={[
                    'text-body-sm font-weight-label',
                    statusWarning ? 'text-warning' : 'text-fg',
                  ].join(' ')}
                >
                  {statusLine}
                </p>
              ) : null}
              <label className="flex cursor-pointer items-start gap-2 text-caption text-muted">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  disabled={busy}
                  onChange={(e) => onLegalAcceptedChange(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <span>{t('legal_notice_create_post')}</span>
              </label>
            </div>

            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
              <button
                type="button"
                disabled={!canPreview || busy}
                onClick={onPreview}
                className="rounded-btn border border-border bg-secondary px-3 py-1.5 font-label text-body-sm text-secondary-fg hover:bg-tertiary disabled:opacity-50"
              >
                {t('preview')}
              </button>
              <button
                type="button"
                disabled={!canPublish || busy}
                onClick={() => onPublish()}
                className="rounded-btn bg-accent px-3 py-1.5 font-label text-body-sm font-weight-strong text-accent-fg hover:opacity-90 disabled:opacity-50"
              >
                {publishLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
