'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { useOfferEditor } from '../../application/use-offer-editor';
import { computeStepCompleteness } from '../../domain/offer-draft.schema';
import { OFFER_EDITOR_STEPS } from '../../domain/offer-form.types';
import { businessNavIdForKind, businessRoutes } from '../../domain/routes';
import type { OblOfferDraftView } from '../../infrastructure/clients/obl-drafts.server';
import { OfferEditorBasicsStep } from './offer-editor/offer-editor-basics-step';
import { OfferEditorBillingStep } from './offer-editor/offer-editor-billing-step';
import { OfferEditorCommercialStep } from './offer-editor/offer-editor-commercial-step';
import { OfferEditorDisputesStep } from './offer-editor/offer-editor-disputes-step';
import { OfferEditorLegalStep } from './offer-editor/offer-editor-legal-step';
import { OfferEditorReviewStep } from './offer-editor/offer-editor-review-step';
import { OfferEditorSchemaStep } from './offer-editor/offer-editor-schema-step';
import { OfferEditorServiceStep } from './offer-editor/offer-editor-service-step';
import { OfferEditorTerminationStep } from './offer-editor/offer-editor-termination-step';
import { OfferFullPreview } from './offer-full-preview';
import { useOblBroadcast } from '../hooks/use-obl-broadcast';
import { BusinessPageShell } from '../layout/business-page-shell';

export type BusinessOfferEditorClientProps = {
  username: string;
  draft: OblOfferDraftView;
};

export function BusinessOfferEditorClient({
  username,
  draft,
}: BusinessOfferEditorClientProps) {
  const { t } = useI18n();
  const { broadcast, phase, isBusy, error } = useOblBroadcast(username);
  const editor = useOfferEditor({ username, draft, broadcast });

  const previewTitleId = 'offer-full-preview-title';

  return (
    <>
      <BusinessPageShell
        activeNav={businessNavIdForKind(draft.kind)}
        title={editor.fields.name || t('business_draft_untitled')}
        subtitle={t('business_editor_subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => editor.setPreviewOpen(true)}
              className="rounded-btn border border-border px-3 py-1 text-body-sm text-link"
            >
              {t('business_full_preview')}
            </button>
            <span className="text-caption text-fg-secondary">
              {editor.saveState === 'saving'
                ? t('business_saving')
                : editor.saveState === 'saved'
                  ? t('business_saved')
                  : ''}
            </span>
          </div>
        }
      >
        <div className="mb-6 flex flex-wrap gap-2">
          {OFFER_EDITOR_STEPS.map((s, i) => {
            const completeness = computeStepCompleteness(s, editor.state);
            return (
              <button
                key={s}
                type="button"
                onClick={() => editor.setStep(s)}
                className={[
                  'rounded-pill border px-3 py-1 text-caption',
                  editor.step === s
                    ? 'border-border bg-surface-alt font-weight-label'
                    : 'border-transparent text-fg-secondary',
                  completeness === 'incomplete' ? 'text-error' : '',
                ].join(' ')}
              >
                {i + 1}. {t(`business_editor_step_${s}`)}
              </button>
            );
          })}
        </div>

        <div className="rounded-card border border-border bg-surface p-card-padding shadow-card">
          {editor.step === 'basics' ? (
            <OfferEditorBasicsStep
              kind={editor.kind}
              fields={editor.fields}
              onKindChange={editor.setKind}
              onFieldsChange={editor.setFields}
              kindLocked
            />
          ) : null}
          {editor.step === 'service' ? (
            <OfferEditorServiceStep
              username={username}
              kind={editor.kind}
              fields={editor.fields}
              onFieldsChange={editor.setFields}
            />
          ) : null}
          {editor.step === 'schema' ? (
            <OfferEditorSchemaStep
              fields={editor.fields}
              onFieldsChange={editor.setFields}
            />
          ) : null}
          {editor.step === 'commercial' ? (
            <OfferEditorCommercialStep
              fields={editor.fields}
              onFieldsChange={editor.setFields}
            />
          ) : null}
          {editor.step === 'billing' ? (
            <OfferEditorBillingStep
              fields={editor.fields}
              onFieldsChange={editor.setFields}
            />
          ) : null}
          {editor.step === 'termination' ? (
            <OfferEditorTerminationStep
              fields={editor.fields}
              onFieldsChange={editor.setFields}
            />
          ) : null}
          {editor.step === 'disputes' ? (
            <OfferEditorDisputesStep
              fields={editor.fields}
              onFieldsChange={editor.setFields}
            />
          ) : null}
          {editor.step === 'legal' ? (
            <OfferEditorLegalStep
              username={username}
              fields={editor.fields}
              legalText={editor.legalText}
              onFieldsChange={editor.setFields}
              onLegalTextChange={editor.setLegalText}
            />
          ) : null}
          {editor.step === 'review' ? (
            <OfferEditorReviewStep
              state={editor.state}
              phase={phase}
              isBusy={isBusy}
              error={error}
              onPublish={() => void editor.publish()}
              onGoToStep={editor.setStep}
            />
          ) : null}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={editor.stepIndex <= 0}
            onClick={editor.goBack}
            className="rounded-btn border border-border px-4 py-2 text-body-sm disabled:opacity-50"
          >
            {t('business_back')}
          </button>
          <button
            type="button"
            disabled={editor.stepIndex >= OFFER_EDITOR_STEPS.length - 1}
            onClick={editor.goNext}
            className="rounded-btn border border-border px-4 py-2 text-body-sm disabled:opacity-50"
          >
            {t('business_continue')}
          </button>
        </div>

        <p className="mt-4">
          <Link
            href={businessRoutes.manageTab(draft.kind, 'drafts')}
            className="text-body-sm text-link"
          >
            {draft.kind === 'request'
              ? t('business_back_to_requests')
              : t('business_back_to_offers')}
          </Link>
        </p>
      </BusinessPageShell>

      <ModalShell
        open={editor.previewOpen}
        onClose={() => editor.setPreviewOpen(false)}
        labelledBy={previewTitleId}
        maxWidthClass="max-w-container-narrow"
        scrollBody
        align="start"
        panelClassName="p-card-padding"
        header={
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-card-padding py-3">
            <h2 id={previewTitleId} className="text-body font-weight-strong text-heading">
              {t('business_full_preview')}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={editor.previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-link"
              >
                {t('business_full_preview_open_tab')}
              </Link>
              <ModalShellCloseButton
                onClose={() => editor.setPreviewOpen(false)}
                ariaLabel={t('business_modal_close')}
              />
            </div>
          </div>
        }
      >
        <OfferFullPreview state={editor.state} author={username} />
      </ModalShell>
    </>
  );
}
