'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  getOfferTermination,
  patchOfferTermination,
  type OfferDraftFields,
} from '../../../domain/offer-form.types';
import { offerEditorFieldClass, offerEditorLabelClass } from './offer-editor-field-styles';

export type OfferEditorTerminationStepProps = {
  fields: OfferDraftFields;
  onFieldsChange: (fields: OfferDraftFields) => void;
};

export function OfferEditorTerminationStep({
  fields,
  onFieldsChange,
}: OfferEditorTerminationStepProps) {
  const { t } = useI18n();
  const termination = getOfferTermination(fields);

  return (
    <div className="flex flex-col gap-4">
      <label className={offerEditorLabelClass}>
        {t('business_field_termination_who')}
        <select
          value={termination.who ?? 'both'}
          onChange={(e) =>
            onFieldsChange(
              patchOfferTermination(fields, {
                who: e.target.value as 'client' | 'provider' | 'both',
              }),
            )
          }
          className={offerEditorFieldClass}
        >
          <option value="client">{t('business_termination_who_client')}</option>
          <option value="provider">{t('business_termination_who_provider')}</option>
          <option value="both">{t('business_termination_who_both')}</option>
        </select>
      </label>

      <label className={offerEditorLabelClass}>
        {t('business_field_termination_mode')}
        <select
          value={termination.mode ?? 'notice'}
          onChange={(e) =>
            onFieldsChange(
              patchOfferTermination(fields, {
                mode: e.target.value as 'instant' | 'notice',
              }),
            )
          }
          className={offerEditorFieldClass}
        >
          <option value="instant">{t('business_termination_mode_instant')}</option>
          <option value="notice">{t('business_termination_mode_notice')}</option>
        </select>
      </label>

      {termination.mode === 'notice' ? (
        <label className={offerEditorLabelClass}>
          {t('business_field_termination_notice_days')}
          <input
            type="number"
            min={1}
            value={termination.noticeDays ?? 30}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              onFieldsChange(
                patchOfferTermination(fields, {
                  noticeDays: Number.isFinite(parsed) ? parsed : undefined,
                }),
              );
            }}
            className={offerEditorFieldClass}
          />
        </label>
      ) : null}

      <label className={offerEditorLabelClass}>
        {t('business_field_termination_notes')}
        <textarea
          value={termination.notes ?? ''}
          onChange={(e) =>
            onFieldsChange(patchOfferTermination(fields, { notes: e.target.value }))
          }
          rows={6}
          className={offerEditorFieldClass}
        />
      </label>
    </div>
  );
}
