'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { buildOdlObjectFavoriteOp } from '@opden-data-layer/hive-broadcast';

import { HeartIcon } from '@/icons';
import { useOdlCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import {
  revalidateObjectAfterBroadcast,
  revalidateUserSocialAfterBroadcast,
} from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

export type AdministrativeHeartButtonProps = {
  objectId: string;
  initialActive: boolean;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  /** Called after a successful favorite broadcast and cache revalidation. */
  onFavoriteChange?: () => void;
};

export function AdministrativeHeartButton({
  objectId,
  initialActive,
  viewerUsername,
  onRequireLogin,
  onFavoriteChange,
}: AdministrativeHeartButtonProps) {
  useHydrateWalletProvider();
  const odlCustomJsonId = useOdlCustomJsonId();
  const router = useRouter();
  const { t } = useI18n();
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive, objectId]);

  const onToggle = useCallback(async () => {
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
      const op = buildOdlObjectFavoriteOp({
        id: odlCustomJsonId,
        objectId,
        method,
        required_posting_auths: [account],
      });
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, async () => {
          await revalidateObjectAfterBroadcast(objectId);
          await revalidateUserSocialAfterBroadcast(account);
        }).finally(() => {
          onFavoriteChange?.();
          setPending(false);
        });
      });
    } catch {
      setActive(previous);
      setPending(false);
    }
  }, [active, objectId, odlCustomJsonId, onFavoriteChange, onRequireLogin, pending, router, viewerUsername]);

  const hint = active ? t('feed_linked_object_admin_hint') : t('object_detail_favorites_add');
  const canInteract = viewerUsername != null && viewerUsername.trim().length > 0;

  if (!canInteract) {
    return (
      <span
        className="inline-flex"
        title={initialActive ? t('feed_linked_object_admin_hint') : undefined}
        aria-label={initialActive ? t('feed_linked_object_admin_hint') : undefined}
      >
        <HeartIcon
          size={22}
          className={initialActive ? 'text-accent fill-current' : 'text-fg-tertiary'}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex rounded-btn p-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      aria-pressed={active}
      title={hint}
      aria-label={hint}
      onClick={() => void onToggle()}
    >
      <HeartIcon
        size={22}
        className={active ? 'text-accent fill-current' : 'text-fg-tertiary'}
      />
    </button>
  );
}
