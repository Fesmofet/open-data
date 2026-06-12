'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, MODAL_Z_INDEX_ABOVE_MAP } from '@/shared/presentation';

export type ExternalLinkModalProps = {
  url: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ExternalLinkModal({ url, onClose, onConfirm }: ExternalLinkModalProps) {
  const { t } = useI18n();

  const header = (
    <div className="flex items-start justify-between gap-4 border-b border-border px-card-padding py-3">
      <h2 id="external-link-dialog-title" className="text-section font-display text-heading">
        {t('external_link_modal_title')}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-btn text-section leading-none text-fg-secondary hover:bg-ghost-surface hover:text-fg"
        aria-label={t('cancel')}
      >
        ×
      </button>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-2 border-t border-border px-card-padding py-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded-btn border border-border px-4 py-2 text-body-sm font-weight-label text-fg hover:bg-surface"
      >
        {t('cancel')}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg hover:opacity-90"
      >
        {t('confirm')}
      </button>
    </div>
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      labelledBy="external-link-dialog-title"
      zIndex={MODAL_Z_INDEX_ABOVE_MAP}
      maxWidthClass="max-w-container-narrow"
      panelClassName="rounded-card-lg"
      header={header}
      footer={footer}
      scrollBody={false}
    >
      <div className="px-card-padding py-3">
        <p className="text-body-sm text-muted">{t('external_link_modal_body')}</p>
        <p className="mt-3 break-all font-weight-label text-accent">{url}</p>
      </div>
    </ModalShell>
  );
}

export type ExternalLinkButtonProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function ExternalLinkButton({ href, className, children }: ExternalLinkButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = useCallback(() => {
    window.open(href, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }, [href]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open ? (
        <ExternalLinkModal
          url={href}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
