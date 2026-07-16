'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  formatTagsInput,
  parseTagsInput,
  type OblOfferKind,
  type OfferDraftFields,
} from '../../../domain/offer-form.types';
import { offerEditorFieldClass, offerEditorLabelClass } from './offer-editor-field-styles';

export type OfferEditorBasicsStepProps = {
  kind: OblOfferKind;
  fields: OfferDraftFields;
  onKindChange: (kind: OblOfferKind) => void;
  onFieldsChange: (fields: OfferDraftFields) => void;
};

export function OfferEditorBasicsStep({
  kind,
  fields,
  onKindChange,
  onFieldsChange,
}: OfferEditorBasicsStepProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <label className={offerEditorLabelClass}>
        {t('business_field_kind')}
        <select
          value={kind}
          onChange={(e) => onKindChange(e.target.value as OblOfferKind)}
          className={offerEditorFieldClass}
        >
          <option value="offer">{t('business_kind_offer')}</option>
          <option value="request">{t('business_kind_request')}</option>
        </select>
      </label>
      <label className={offerEditorLabelClass}>
        {t('business_field_name')}
        <input
          value={fields.name ?? ''}
          onChange={(e) => onFieldsChange({ ...fields, name: e.target.value })}
          className={offerEditorFieldClass}
        />
      </label>
      <label className={offerEditorLabelClass}>
        {t('business_field_description')}
        <textarea
          value={fields.description ?? ''}
          onChange={(e) => onFieldsChange({ ...fields, description: e.target.value })}
          rows={4}
          className={offerEditorFieldClass}
        />
      </label>
      <label className={offerEditorLabelClass}>
        {t('business_field_tags')}
        <input
          value={formatTagsInput(fields.tags)}
          onChange={(e) =>
            onFieldsChange({ ...fields, tags: parseTagsInput(e.target.value) })
          }
          placeholder={t('business_field_tags_hint')}
          className={offerEditorFieldClass}
        />
      </label>
    </div>
  );
}
