'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';

import { DEFAULT_LOCALE } from '@/i18n/config/default-locale';
import { locales } from '@/i18n/config/locales';
import { useOdlCustomJsonId } from '@/config/odl-network-provider';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import {
  buildEditorQuickCreateOps,
  prepareEditorQuickCreateFields,
} from '@/modules/object-create/application/build-editor-quick-create-ops';
import { checkObjectIdExists } from '@/modules/object-create/infrastructure/actions/check-object-id.action';
import { descriptionForObjectType, labelForObjectType } from '@/modules/object-create/domain/object-type-display';
import { ObjectTypeSearchSelect } from '@/modules/object-create/presentation/components/object-type-search-select';
import { awaitObjectIndexed, awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';
import { ModalShell, ModalShellCloseButton, MODAL_Z_INDEX_ABOVE_MAP } from '@/shared/presentation';
import { CaseTransformTextField } from '@/shared/presentation/components/case-transform-text-field';

export type EditorCreateObjectModalProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  onCreated: (objectId: string) => void | Promise<void>;
};

export function EditorCreateObjectModal({
  open,
  onClose,
  username,
  onCreated,
}: EditorCreateObjectModalProps) {
  useHydrateWalletProvider();
  const { t } = useI18n();
  const router = useRouter();
  const odlCustomJsonId = useOdlCustomJsonId();
  const nameId = useId();
  const languageId = useId();
  const typeId = useId();

  const [name, setName] = useState('');
  const [language, setLanguage] = useState<string>(DEFAULT_LOCALE);
  const [objectType, setObjectType] = useState('');
  const [likeChecked, setLikeChecked] = useState(true);
  const [followChecked, setFollowChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName('');
      setLanguage(DEFAULT_LOCALE);
      setObjectType('');
      setLikeChecked(true);
      setFollowChecked(false);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const canSubmit =
    name.trim().length > 0 && objectType.trim().length > 0 && !submitting;

  const typeDescription = objectType
    ? descriptionForObjectType(objectType)
    : '';

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    const trimmedName = name.trim();
    const type = objectType.trim();
    const { objectId, objectIdPrefix, fields } = prepareEditorQuickCreateFields(
      type,
      language,
      trimmedName,
    );

    if (!objectId.includes('-') || objectId === objectIdPrefix) {
      setError(t('object_create_completeness_hint_name_slug'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const exists = await checkObjectIdExists(objectId);
      if (exists === true) {
        setError(t('object_create_id_taken'));
        setSubmitting(false);
        return;
      }
      if (exists === null) {
        setError(t('object_edit_validation_error'));
        setSubmitting(false);
        return;
      }

      const ops = buildEditorQuickCreateOps({
        objectId,
        objectType: type,
        creator: username,
        odlCustomJsonId,
        fields,
        language,
        likeName: likeChecked,
        followObject: followChecked,
      });

      const { transactionId } = await getWalletFacade().broadcast({
        operations: ops,
      });

      onClose();
      void awaitTrxConfirmation(transactionId).finally(async () => {
        await awaitObjectIndexed(objectId);
        await refreshAfterBroadcast(router, () =>
          revalidateObjectAfterBroadcast(objectId),
        );
        await onCreated(objectId);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('object_edit_validation_error'),
      );
      setSubmitting(false);
    }
  }, [
    canSubmit,
    name,
    objectType,
    language,
    likeChecked,
    followChecked,
    username,
    odlCustomJsonId,
    onClose,
    onCreated,
    router,
    t,
  ]);

  if (!open) {
    return null;
  }

  const createLabel = objectType
    ? t('object_create_create_type').replace(
        '{type}',
        labelForObjectType(objectType),
      )
    : t('create_new_object');

  const header = (
    <div className="flex items-center justify-between gap-4 border-b border-border px-card-padding py-3">
      <h2
        id="editor-create-object-dialog-title"
        className="min-w-0 flex-1 text-section font-display text-heading"
      >
        {t('create_new_object')}
      </h2>
      <ModalShellCloseButton
        onClose={onClose}
        disabled={submitting}
        ariaLabel={t('object_edit_cancel')}
      />
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-2 border-t border-border px-card-padding py-3">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="rounded-btn border border-border px-4 py-2 text-body-sm font-weight-label text-fg hover:bg-surface"
      >
        {t('object_edit_cancel')}
      </button>
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!canSubmit}
        className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? t('object_edit_submitting') : createLabel}
      </button>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy="editor-create-object-dialog-title"
      zIndex={MODAL_Z_INDEX_ABOVE_MAP}
      maxWidthClass="max-w-container-narrow"
      panelClassName="rounded-card-lg"
      header={header}
      footer={footer}
    >
      <div className="space-y-4 p-card-padding">
        <CaseTransformTextField
          id={nameId}
          autoComplete="off"
          value={name}
          onChange={setName}
          disabled={submitting}
          placeholder={t('enter_name')}
          label={<span className="text-muted">{t('object_field_name')}</span>}
        />

        <label className="block text-body-sm" htmlFor={languageId}>
          <span className="text-muted">{t('object_edit_locale_label')}</span>
          <select
            id={languageId}
            className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={submitting}
          >
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <ObjectTypeSearchSelect
          id={typeId}
          label={t('object_create_type_label')}
          value={objectType}
          onChange={setObjectType}
          disabled={submitting}
        />

        {typeDescription ? (
          <p className="text-body-sm text-muted">{typeDescription}</p>
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 text-body-sm text-muted">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-accent"
            checked={likeChecked}
            onChange={(e) => setLikeChecked(e.target.checked)}
            disabled={submitting}
          />
          <span>{t('like')}</span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 text-body-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
            checked={followChecked}
            onChange={(e) => setFollowChecked(e.target.checked)}
            disabled={submitting}
          />
          <span className="min-w-0">
            <span className="block text-muted">{t('follow')}</span>
            <span className="mt-0.5 block text-caption text-fg-secondary">
              {t('follow_extra')}
            </span>
          </span>
        </label>

        {error ? (
          <p className="text-body-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}
