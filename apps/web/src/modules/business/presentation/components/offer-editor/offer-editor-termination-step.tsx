'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { OfferDraftFields } from '../../../domain/offer-form.types';
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

  return (
    <label className={offerEditorLabelClass}>
      {t('business_field_termination_notes')}
      <textarea
        value={fields.terminationNotes ?? ''}
        onChange={(e) => onFieldsChange({ ...fields, terminationNotes: e.target.value })}
        rows={6}
        className={offerEditorFieldClass}
      />
    </label>
  );
}
