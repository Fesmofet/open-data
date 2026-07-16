'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { OBL_CATALOG_OBJECT_TYPES } from '../../../domain/obl-catalog-types';

import type { OfferDraftFields } from '../../../domain/offer-form.types';
import { BusinessDisclosure } from '../business-disclosure';
import { offerEditorFieldClass, offerEditorLabelClass } from './offer-editor-field-styles';
import { OfferEditorObjectRefField } from './offer-editor-object-ref-field';

export type OfferEditorLegalStepProps = {
  username: string;
  fields: OfferDraftFields;
  legalText: string;
  onFieldsChange: (fields: OfferDraftFields) => void;
  onLegalTextChange: (text: string) => void;
};

export function OfferEditorLegalStep({
  username,
  fields,
  legalText,
  onFieldsChange,
  onLegalTextChange,
}: OfferEditorLegalStepProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-fg-secondary">{t('business_field_legal_intro')}</p>

      <OfferEditorObjectRefField
        username={username}
        label={t('business_field_legal_ref')}
        value={fields.legalRef ?? ''}
        onChange={(objectId) => onFieldsChange({ ...fields, legalRef: objectId })}
        objectType={OBL_CATALOG_OBJECT_TYPES.LEGAL_DOCUMENT}
      />
      <p className="text-caption text-fg-secondary">{t('business_field_legal_ref_hint')}</p>

      <label className={offerEditorLabelClass}>
        {t('business_field_legal_text')}
        <textarea
          value={legalText}
          onChange={(e) => onLegalTextChange(e.target.value)}
          rows={8}
          placeholder={t('business_field_legal_text_placeholder')}
          className={`${offerEditorFieldClass} font-mono text-body-sm`}
        />
      </label>
      <p className="text-caption text-fg-secondary">{t('business_field_legal_text_hint')}</p>

      <BusinessDisclosure variant="legal_ref_warning" />
    </div>
  );
}
