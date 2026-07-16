'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { OBL_CATALOG_OBJECT_TYPES } from '../../../domain/obl-catalog-types';
import { buildDiscoverHref } from '@/modules/discover/domain/discover-url';
import { fetchDiscoverObjects } from '@/modules/discover/infrastructure/discover.client';
import type { SocialProjectedObjectView } from '@/modules/user-social/application/dto/user-social.dto';

import type { OfferDraftFields } from '../../../domain/offer-form.types';
import { OfferEditorObjectRefField } from './offer-editor-object-ref-field';

function serviceObjectLabel(item: SocialProjectedObjectView): string {
  const name = item.fields['name'];
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim();
  }
  const title = item.fields['title'];
  if (typeof title === 'string' && title.trim().length > 0) {
    return title.trim();
  }
  return item.object_id;
}

export type OfferEditorServiceStepProps = {
  username: string;
  kind: 'offer' | 'request';
  fields: OfferDraftFields;
  onFieldsChange: (fields: OfferDraftFields) => void;
};

export function OfferEditorServiceStep({
  username,
  kind,
  fields,
  onFieldsChange,
}: OfferEditorServiceStepProps) {
  const { t } = useI18n();
  const objectType =
    kind === 'offer'
      ? OBL_CATALOG_OBJECT_TYPES.SERVICE_OFFERED
      : OBL_CATALOG_OBJECT_TYPES.SERVICE_REQUESTED;
  const [suggestions, setSuggestions] = useState<SocialProjectedObjectView[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetchDiscoverObjects({
      objectType,
      limit: 12,
      signal: controller.signal,
    }).then((page) => {
      if (!controller.signal.aborted) {
        setSuggestions(page?.items ?? []);
        setLoadingSuggestions(false);
      }
    });
    return () => controller.abort();
  }, [objectType]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-fg-secondary">{t('business_field_service_ref_hint')}</p>

      <OfferEditorObjectRefField
        username={username}
        label={t('business_field_service_ref')}
        value={fields.serviceRef ?? ''}
        onChange={(objectId) => onFieldsChange({ ...fields, serviceRef: objectId })}
        objectType={objectType}
      />

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-sm font-weight-label text-heading">
            {t('business_service_suggestions_title')}
          </p>
          <Link
            href={buildDiscoverHref({ type: objectType })}
            className="text-body-sm text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('business_browse_services')}
          </Link>
        </div>
        {loadingSuggestions ? (
          <p className="text-caption text-fg-secondary">{t('business_loading')}</p>
        ) : suggestions.length === 0 ? (
          <p className="text-body-sm text-fg-secondary">{t('business_service_suggestions_empty')}</p>
        ) : (
          <ul className="flex flex-col gap-1 rounded-card border border-border bg-surface-alt p-2">
            {suggestions.map((item) => {
              const selected = fields.serviceRef === item.object_id;
              return (
                <li key={item.object_id}>
                  <button
                    type="button"
                    onClick={() => onFieldsChange({ ...fields, serviceRef: item.object_id })}
                    className={[
                      'flex w-full items-center justify-between gap-2 rounded-btn px-2 py-2 text-start text-body-sm',
                      selected
                        ? 'bg-surface font-weight-label text-heading'
                        : 'text-fg hover:bg-ghost-surface',
                    ].join(' ')}
                  >
                    <span className="min-w-0 truncate">
                      {serviceObjectLabel(item)}
                    </span>
                    <span className="shrink-0 text-caption text-fg-secondary">
                      {item.object_id}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
