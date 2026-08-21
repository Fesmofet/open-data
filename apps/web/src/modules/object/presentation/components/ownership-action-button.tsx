'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { buildOdlObjectOwnershipOp } from '@opden-data-layer/hive-broadcast';

import { useOdlCustomJsonId } from '@/config/odl-network-provider';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import type { OwnershipSubType } from '../../domain/object-page.types';

export type OwnershipActionButtonProps = {
  objectId: string;
  ownershipType: OwnershipSubType;
  hasOwnership: boolean;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
};

export function OwnershipActionButton({
  objectId,
  ownershipType,
  hasOwnership,
  viewerUsername,
  onRequireLogin,
}: OwnershipActionButtonProps) {
  useHydrateWalletProvider();
  const odlCustomJsonId = useOdlCustomJsonId();
  const router = useRouter();
  const { t } = useI18n();
  const [active, setActive] = useState(hasOwnership);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setActive(hasOwnership);
  }, [hasOwnership, objectId, ownershipType]);

  const onClick = useCallback(async () => {
    const account = viewerUsername?.trim();
    if (!account) {
      onRequireLogin?.();
      return;
    }
    if (pending) {
      return;
    }
    const method = active ? 'remove' : 'add';
    const previous = active;
    setActive(!previous);
    setPending(true);
    try {
      const op = buildOdlObjectOwnershipOp({
        id: odlCustomJsonId,
        objectId,
        ownershipType,
        method,
        required_posting_auths: [account],
      });
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, () =>
          revalidateObjectAfterBroadcast(objectId),
        ).finally(() => {
          setPending(false);
        });
      });
    } catch {
      setActive(previous);
      setPending(false);
    }
  }, [
    active,
    ownershipType,
    objectId,
    odlCustomJsonId,
    onRequireLogin,
    pending,
    router,
    viewerUsername,
  ]);

  const label = active
    ? t('object_ownership_action_remove')
    : t('object_ownership_action_claim');

  return (
    <div className="flex justify-end">
      <button
        type="button"
        disabled={pending}
        className={[
          'rounded-btn border px-4 py-2 text-body-sm font-weight-label transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          active
            ? 'border-border bg-surface-control text-muted hover:bg-surface-control-hover'
            : 'border-accent text-accent hover:bg-accent/10',
          pending ? 'cursor-not-allowed opacity-50' : '',
        ].join(' ')}
        onClick={() => void onClick()}
      >
        {label}
      </button>
    </div>
  );
}

/** @deprecated Use {@link OwnershipActionButton} */
export const AuthorityActionButton = OwnershipActionButton;
export type AuthorityActionButtonProps = OwnershipActionButtonProps;
