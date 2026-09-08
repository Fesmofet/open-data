'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useLoginModal } from '@/modules/auth/presentation';
import { StatHoverTooltip, UserAvatar } from '@/shared/presentation';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';

import type { UserPermissionsAuthorityRow } from '../../application/dto/user-permissions.dto';
import { buildRevokeAuthorityOpAction } from '../../infrastructure/actions/build-authority-update-op.server';
import { useAuthorityBroadcast } from '../hooks/use-authority-broadcast';

export type UserPermissionsRowProps = {
  row: UserPermissionsAuthorityRow;
  profileAccountName: string;
  viewerUsername: string | null;
  canRevoke: boolean;
  onBroadcastRevalidate?: (accountName: string) => Promise<void>;
};

function authorityBadgeClass(type: UserPermissionsAuthorityRow['authorityType']): string {
  if (type === 'owner') {
    return 'bg-status-warning/15 text-status-warning';
  }
  if (type === 'active') {
    return 'bg-accent/15 text-accent';
  }
  return 'bg-surface-alt text-fg-secondary';
}

export function UserPermissionsRow({
  row,
  profileAccountName,
  viewerUsername,
  canRevoke,
  onBroadcastRevalidate,
}: UserPermissionsRowProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { openLogin } = useLoginModal();
  const { broadcast, pending } = useAuthorityBroadcast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeConfirm, setActiveConfirm] = useState(false);

  const href = `/@${encodeURIComponent(row.accountName)}`;
  const showRemove =
    canRevoke &&
    viewerUsername != null &&
    viewerUsername.toLowerCase() === profileAccountName.toLowerCase() &&
    (row.authorityType === 'posting' || row.authorityType === 'active');

  const onRemove = useCallback(async () => {
    const viewer = viewerUsername?.trim();
    if (!viewer) {
      openLogin();
      return;
    }
    if (row.authorityType !== 'posting' && row.authorityType !== 'active') {
      return;
    }

    const needsActiveConfirm = row.authorityType === 'active';
    if (needsActiveConfirm && !activeConfirm) {
      setConfirmOpen(true);
      return;
    }

    const built = await buildRevokeAuthorityOpAction({
      grantor: profileAccountName,
      grantee: row.accountName,
      authorityType: row.authorityType,
    });
    if (!built.ok) {
      return;
    }

    const ok = await broadcast([built.operation]);
    if (!ok) {
      return;
    }

    setConfirmOpen(false);
    setActiveConfirm(false);
    await refreshAfterBroadcast(
      router,
      () => onBroadcastRevalidate?.(profileAccountName) ?? Promise.resolve(),
    );
  }, [
    activeConfirm,
    broadcast,
    onBroadcastRevalidate,
    openLogin,
    profileAccountName,
    row.accountName,
    row.authorityType,
    router,
    viewerUsername,
  ]);

  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Link href={href} className="shrink-0" suppressHydrationWarning>
        <UserAvatar
          username={row.accountName}
          avatarUrl={row.avatarUrl}
          displayName={row.accountName}
          size={44}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="font-weight-label text-fg hover:underline"
          suppressHydrationWarning
        >
          {row.accountName}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-caption text-fg-secondary">
          <StatHoverTooltip content={t('stat_user_expertise_tooltip')}>
            <span className="rounded-btn border border-border bg-surface-control px-2 py-0.5 font-mono text-body-sm text-fg">
              {(row.wobjectsWeight ?? 0).toFixed(2)}
            </span>
          </StatHoverTooltip>
          <span aria-hidden>·</span>
          <StatHoverTooltip content={t('stat_user_followers_tooltip')}>
            <span>{row.usersFollowingCount}</span>
          </StatHoverTooltip>
          <span aria-hidden>·</span>
          <span
            className={[
              'rounded-btn px-2 py-0.5 text-caption uppercase tracking-wide',
              authorityBadgeClass(row.authorityType),
            ].join(' ')}
          >
            {t(`permissions_authority_${row.authorityType}`)}
          </span>
        </p>
      </div>
      {showRemove ? (
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={t('permissions_remove_authority')}
            disabled={pending}
            onClick={() => {
              if (row.authorityType === 'active') {
                setConfirmOpen(true);
              } else {
                void onRemove();
              }
            }}
            className="inline-flex size-8 items-center justify-center rounded-btn text-fg-secondary hover:bg-surface-alt hover:text-fg disabled:opacity-50"
          >
            ×
          </button>
          {confirmOpen && row.authorityType === 'active' ? (
            <div className="absolute end-0 top-full z-20 mt-1 w-64 rounded-card border border-border bg-surface-raised p-3 shadow-card-float">
              <p className="mb-3 text-body-sm text-fg">{t('permissions_active_revoke_confirm')}</p>
              <label className="mb-3 flex items-start gap-2 text-body-sm text-fg-secondary">
                <input
                  type="checkbox"
                  checked={activeConfirm}
                  onChange={(e) => setActiveConfirm(e.target.checked)}
                />
                {t('permissions_active_revoke_ack')}
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-btn px-3 py-1.5 text-body-sm text-fg-secondary hover:bg-surface-alt"
                  onClick={() => {
                    setConfirmOpen(false);
                    setActiveConfirm(false);
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={!activeConfirm || pending}
                  className="rounded-btn bg-accent px-3 py-1.5 text-body-sm text-on-accent disabled:opacity-50"
                  onClick={() => void onRemove()}
                >
                  {t('permissions_remove_authority')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
