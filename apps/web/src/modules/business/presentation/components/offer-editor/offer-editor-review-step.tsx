'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  computeStepCompleteness,
  publishErrorMessageKey,
  validateOfferDraftForPublish,
} from '../../../domain/offer-draft.schema';
import {
  OFFER_EDITOR_STEPS,
  type OfferDraftState,
  type OfferEditorStep,
} from '../../../domain/offer-form.types';
import { BusinessDisclosure } from '../business-disclosure';
import { StateBadge } from '../state-badge';

export type OfferEditorReviewStepProps = {
  state: OfferDraftState;
  phase: string;
  error: string | null;
  onPublish: () => void;
  onGoToStep?: (step: OfferEditorStep) => void;
};

const CHECKLIST_STEPS = OFFER_EDITOR_STEPS.filter((s) => s !== 'review');

function stepStatus(
  step: OfferEditorStep,
  state: OfferDraftState,
  stepErrors: string[],
): 'blocked' | 'ready' | 'optional' | 'incomplete' {
  if (stepErrors.length > 0) {
    return 'blocked';
  }
  const completeness = computeStepCompleteness(step, state);
  if (completeness === 'complete') {
    return 'ready';
  }
  if (completeness === 'empty') {
    return 'optional';
  }
  return 'incomplete';
}

export function OfferEditorReviewStep({
  state,
  phase,
  error,
  onPublish,
  onGoToStep,
}: OfferEditorReviewStepProps) {
  const { t } = useI18n();
  const validation = validateOfferDraftForPublish(state);
  const canPublish = validation.ok;

  const blockingIssues = CHECKLIST_STEPS.flatMap((step) => {
    const codes = !validation.ok ? (validation.errors[step] ?? []) : [];
    return codes.map((code) => ({
      step,
      code,
      message: t(publishErrorMessageKey(code)),
    }));
  });

  return (
    <div className="flex flex-col gap-4">
      <BusinessDisclosure variant="immutable_version" />
      <h3 className="text-body font-weight-strong text-heading">
        {t('business_review_checklist_title')}
      </h3>
      <ul className="flex flex-col gap-2">
        {CHECKLIST_STEPS.map((step) => {
          const stepErrors = !validation.ok ? (validation.errors[step] ?? []) : [];
          const status = stepStatus(step, state, stepErrors);
          const statusClass =
            status === 'blocked' || status === 'incomplete'
              ? 'text-error'
              : status === 'ready'
                ? 'text-validity-approved'
                : 'text-fg-secondary';

          return (
            <li
              key={step}
              className={[
                'rounded-btn border px-3 py-2 text-body-sm',
                status === 'blocked' || status === 'incomplete'
                  ? 'border-error/40 bg-error/5'
                  : 'border-border',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-weight-label">{t(`business_editor_step_${step}`)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusClass}>
                    {status === 'ready'
                      ? t('business_review_checklist_ok')
                      : status === 'optional'
                        ? t('business_review_checklist_optional')
                        : status === 'blocked'
                          ? t('business_review_checklist_blocked')
                          : t('business_step_incomplete')}
                  </span>
                  {(status === 'blocked' || status === 'incomplete') && onGoToStep ? (
                    <button
                      type="button"
                      onClick={() => onGoToStep(step)}
                      className="text-link underline-offset-2 hover:underline"
                    >
                      {t('business_review_fix_step')}
                    </button>
                  ) : null}
                </div>
              </div>
              {stepErrors.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 text-caption text-error">
                  {stepErrors.map((code) => (
                    <li key={code}>{t(publishErrorMessageKey(code))}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!canPublish ? (
        <div className="rounded-btn border border-error/40 bg-error/5 px-3 py-2 text-body-sm text-error">
          <p className="font-weight-label">{t('business_publish_blocked')}</p>
          {blockingIssues.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {blockingIssues.map((issue) => (
                <li key={`${issue.step}-${issue.code}`}>
                  <span className="font-weight-label">
                    {t(`business_editor_step_${issue.step}`)}:
                  </span>{' '}
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {phase === 'indexing' ? <StateBadge variant="indexing" /> : null}
      {error ? <p className="text-body-sm text-error">{error}</p> : null}
      <button
        type="button"
        disabled={!canPublish}
        onClick={onPublish}
        className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
      >
        {t('business_publish_version')}
      </button>
    </div>
  );
}
