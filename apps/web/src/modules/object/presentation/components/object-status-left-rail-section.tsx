'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import {
  buildOdlUpdateCreateWithLikeOp,
} from '@opden-data-layer/hive-broadcast';
import { UPDATE_REGISTRY } from '@opden-data-layer/core/update-registry';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { useOdlCustomJsonId } from '@/config/odl-network-provider';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { initialStatusFormValue } from '@/modules/object-updates/application/status-form-value';
import { validateUpdateValue } from '@/modules/object-updates/application/update-value-form.utils';
import { StatusUpdateForm } from '@/modules/object-updates/presentation/components/status-update-form';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { LeftRailUpdateCountBadge } from './left-rail-update-count-badge';

function IconAddUpdate({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M7 2.5v9M2.5 7h9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type ObjectStatusLeftRailSectionProps = {
  headingLabel: string;
  objectId: string;
  viewerUsername?: string | null;
  count?: number;
  onViewUpdates?: () => void;
  onAdd?: () => void;
  addLabel: string;
  onRequireLogin?: () => void;
};

export function ObjectStatusLeftRailSection({
  headingLabel,
  objectId,
  viewerUsername,
  count,
  onViewUpdates,
  onAdd,
  addLabel,
  onRequireLogin,
}: ObjectStatusLeftRailSectionProps) {
  useHydrateWalletProvider();
  const { t } = useI18n();
  const router = useRouter();
  const odlCustomJsonId = useOdlCustomJsonId();

  const [formValue, setFormValue] = useState<unknown>(() => initialStatusFormValue());
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshAfterStatusBroadcast = useCallback(async () => {
    await refreshAfterBroadcast(router, () =>
      revalidateObjectAfterBroadcast(objectId),
    );
    setFormValue(initialStatusFormValue());
  }, [objectId, router]);

  const onApply = useCallback(async () => {
    const definition = UPDATE_REGISTRY[UPDATE_TYPES.STATUS];
    if (!definition) {
      return;
    }
    const voter = viewerUsername?.trim();
    if (!voter) {
      onRequireLogin?.();
      return;
    }
    const parsed = validateUpdateValue(definition, formValue);
    if (!parsed.success) {
      return;
    }

    setBusy(true);
    try {
      const createInput = {
        id: odlCustomJsonId,
        objectId,
        updateType: UPDATE_TYPES.STATUS,
        creator: voter,
        valueKind: definition.value_kind,
        value: parsed.value,
        required_posting_auths: [voter],
      } as const;
      const op = buildOdlUpdateCreateWithLikeOp(createInput);
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterStatusBroadcast();
      });
    } finally {
      setBusy(false);
    }
  }, [
    formValue,
    objectId,
    odlCustomJsonId,
    onRequireLogin,
    refreshAfterStatusBroadcast,
    viewerUsername,
  ]);

  return (
    <>
      <div className="flex items-start gap-2">
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill border border-accent bg-accent/10 text-accent hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={addLabel}
            title={addLabel}
          >
            <IconAddUpdate className="block shrink-0" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-weight-label text-fg">{headingLabel}</p>
          {count != null ? (
            <div className="mt-1">
              <LeftRailUpdateCountBadge
                count={count}
                onClick={onViewUpdates}
                fieldLabel={headingLabel}
              />
            </div>
          ) : null}
        </div>
      </div>
      <StatusUpdateForm
        value={formValue}
        onChange={setFormValue}
        onValidityChange={setValid}
        excludeObjectId={objectId}
      />
      <button
        type="button"
        disabled={!valid || busy}
        onClick={() => void onApply()}
        className="w-full rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {busy ? t('object_edit_submitting') : t('object_edit_status_apply')}
      </button>
    </>
  );
}
