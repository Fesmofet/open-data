'use client';

import { useState, type ReactNode } from 'react';

import { useLoginModal } from '@/modules/auth/presentation';
import { ExternalLinkButton } from '@/modules/object/presentation/components/external-link-modal';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { PROFILE_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';
import { useWalletModal } from '@/modules/user-wallet/presentation/components/wallet/wallet-modal-context';
import type { WalletTransferAsset } from '@/modules/user-wallet/domain/wallet-modal-types';

import type { UserAccountSidebarView, UserAccountSidebarCryptoWallet } from '../../domain/types/user-account-sidebar-view';
import {
  formatManaPercent,
  formatSidebarUsd,
  formatWebsiteLabel,
  truncateEmail,
} from '../utils/account-sidebar-format';
import {
  mapAccountSidebarSocialLink,
  PROFILE_SIDEBAR_TRANSFER_WALLETS,
} from '../utils/profile-sidebar-social';
import { ProfileAccountSidebarActiveTime } from './profile-account-sidebar-active-time';
import {
  mapCryptoWalletIconSrc,
  ProfileCryptoWalletModal,
} from './profile-crypto-wallet-modal';
import {
  SidebarCalendarIcon,
  SidebarClockIcon,
  SidebarDollarIcon,
  SidebarFlashIcon,
  SidebarCircleStarIcon,
  SidebarLinkIcon,
  SidebarLocationIcon,
  SidebarMailIcon,
  SidebarThumbsDownIcon,
  SidebarThumbsUpIcon,
  SidebarBrandIcon,
} from './profile-account-sidebar-icons';

type ProfileAccountSidebarProps = {
  accountName: string;
  viewerUsername: string | null;
  model: UserAccountSidebarView;
};

function SidebarRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 text-body-sm text-fg">
      {icon}
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}

function SidebarMetricRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <SidebarRow icon={icon}>
      <span className="text-fg">
        {label}: {value}
      </span>
    </SidebarRow>
  );
}

const SIDEBAR_ACCENT_ROW_CLASS =
  'flex w-full items-start gap-2 rounded-btn text-left text-body-sm text-accent transition-opacity hover:opacity-80 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

function SidebarBrandButton({
  iconSrc,
  label,
  onClick,
}: {
  iconSrc: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={SIDEBAR_ACCENT_ROW_CLASS}
    >
      <SidebarBrandIcon src={iconSrc} />
      <span className="min-w-0 flex-1 font-weight-label">{label}</span>
    </button>
  );
}

export function ProfileAccountSidebar({
  accountName,
  viewerUsername,
  model,
}: ProfileAccountSidebarProps) {
  const { t, locale } = useI18n();
  const { openLogin } = useLoginModal();
  const { openModal } = useWalletModal();
  const [cryptoWalletModal, setCryptoWalletModal] =
    useState<UserAccountSidebarCryptoWallet | null>(null);
  const website = model.website ? formatWebsiteLabel(model.website) : null;
  const joinedDate =
    model.joinedAt != null
      ? new Date(model.joinedAt).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;
  const socialRows = model.socialLinks.map(mapAccountSidebarSocialLink);

  function openTransfer(asset: WalletTransferAsset) {
    if (!viewerUsername?.trim()) {
      openLogin();
      return;
    }
    openModal({
      kind: 'transfer',
      asset,
      presetTo: accountName,
      lockRecipient: true,
      lockAsset: true,
    });
  }

  return (
    <aside
      className={[
        PROFILE_RAIL_STICKY_CLASS,
        'rounded-card bg-surface-alt p-card-padding text-body-sm text-fg',
      ].join(' ')}
      aria-label={t('user_profile_account_sidebar_aria')}
    >
      <div className="min-w-0 break-words">
        {model.about.trim().length > 0 && (
          <p className="text-body text-fg">{model.about}</p>
        )}

        <div className={model.about.trim().length > 0 ? 'mt-4 space-y-2' : 'space-y-2'}>
          {model.location && (
            <SidebarRow icon={<SidebarLocationIcon />}>{model.location}</SidebarRow>
          )}
          {website?.href && (
            <SidebarRow icon={<SidebarLinkIcon />}>
              <ExternalLinkButton href={website.href} className="text-accent hover:underline">
                {website.label}
              </ExternalLinkButton>
            </SidebarRow>
          )}
          {model.email && (
            <SidebarRow icon={<SidebarMailIcon />}>
              <a
                href={`mailto:${model.email}`}
                className="text-accent hover:underline"
                suppressHydrationWarning
              >
                {truncateEmail(model.email)}
              </a>
            </SidebarRow>
          )}

          <div className="space-y-2">
            {joinedDate && (
              <SidebarRow icon={<SidebarCalendarIcon />}>
                {t('joined_date').replace('{date}', joinedDate)}
              </SidebarRow>
            )}
            <SidebarRow icon={<SidebarCircleStarIcon />}>
              {t('expertise')}: {model.expertiseWeight.toFixed(2)}
            </SidebarRow>
            {model.lastActivityAt && (
              <SidebarRow icon={<SidebarClockIcon />}>
                {t('active_info')}:{' '}
                <ProfileAccountSidebarActiveTime timestamp={model.lastActivityAt} />
              </SidebarRow>
            )}
            <SidebarRow icon={<SidebarDollarIcon />}>
              {t('vote_value')}: {formatSidebarUsd(model.totalVoteValueUsd, locale)}
            </SidebarRow>
          </div>

          {(socialRows.length > 0 ||
            PROFILE_SIDEBAR_TRANSFER_WALLETS.length > 0 ||
            model.cryptoWallets.length > 0) && (
            <div className="space-y-2">
              {socialRows.map((row) => (
                <ExternalLinkButton
                  key={`${row.label}-${row.href}`}
                  href={row.href}
                  className={SIDEBAR_ACCENT_ROW_CLASS}
                >
                  <SidebarBrandIcon src={row.iconSrc} />
                  <span className="min-w-0 flex-1 font-weight-label">{row.label}</span>
                </ExternalLinkButton>
              ))}
              {PROFILE_SIDEBAR_TRANSFER_WALLETS.map((wallet) => (
                <SidebarBrandButton
                  key={wallet.asset}
                  iconSrc={wallet.iconSrc}
                  label={wallet.label}
                  onClick={() => openTransfer(wallet.asset)}
                />
              ))}
              {model.cryptoWallets.map((wallet) => (
                <SidebarBrandButton
                  key={wallet.id}
                  iconSrc={mapCryptoWalletIconSrc(wallet)}
                  label={wallet.shortName}
                  onClick={() => setCryptoWalletModal(wallet)}
                />
              ))}
            </div>
          )}

          <ProfileCryptoWalletModal
            wallet={cryptoWalletModal}
            open={cryptoWalletModal != null}
            onClose={() => setCryptoWalletModal(null)}
          />

          <div className="mt-5">
            <h4 className="font-weight-strong text-body text-fg">{t('waiv_token')}</h4>
            <div className="mt-2 space-y-2">
              <SidebarMetricRow
                icon={<SidebarThumbsUpIcon />}
                label={t('upvoting_mana')}
                value={formatManaPercent(model.waiv.upvotingManaPercent)}
              />
              <SidebarMetricRow
                icon={<SidebarThumbsDownIcon />}
                label={t('downvoting_mana')}
                value={formatManaPercent(model.waiv.downvotingManaPercent)}
              />
              <SidebarMetricRow
                icon={<SidebarDollarIcon />}
                label={t('waiv_vote')}
                value={formatSidebarUsd(model.waiv.voteValueUsd, locale)}
              />
            </div>
          </div>

          <div className="mt-5">
            <h4 className="font-weight-strong text-body text-fg">{t('hive_token')}</h4>
            <div className="mt-2 space-y-2">
              <SidebarMetricRow
                icon={<SidebarCircleStarIcon />}
                label={t('steem_reputation')}
                value={model.hive.reputation.toFixed(2)}
              />
              <SidebarMetricRow
                icon={<SidebarThumbsUpIcon />}
                label={t('upvoting_mana')}
                value={formatManaPercent(model.hive.upvotingManaPercent)}
              />
              <SidebarMetricRow
                icon={<SidebarThumbsDownIcon />}
                label={t('downvoting_mana')}
                value={formatManaPercent(model.hive.downvotingManaPercent)}
              />
              <SidebarMetricRow
                icon={<SidebarFlashIcon />}
                label={t('resource_credits')}
                value={formatManaPercent(model.hive.resourceCreditsPercent)}
              />
              <SidebarMetricRow
                icon={<SidebarDollarIcon />}
                label={t('hive_vote')}
                value={formatSidebarUsd(model.hive.voteValueUsd, locale)}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
