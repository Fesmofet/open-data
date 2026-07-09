import {
  isProjectedLinkKind,
  linkKindDisplayLabel,
  linkKindPublicIconSrc,
} from '@/modules/object/infrastructure/object-projected-fields';

import type { UserAccountSidebarSocialLink } from '../../domain/types/user-account-sidebar-view';

export type ProfileSidebarSocialRow = {
  iconSrc: string;
  label: string;
  href: string;
  external: boolean;
};

export function mapAccountSidebarSocialLink(
  link: UserAccountSidebarSocialLink,
): ProfileSidebarSocialRow {
  const typeNorm = link.type.trim().toLowerCase();
  if (isProjectedLinkKind(typeNorm)) {
    return {
      iconSrc: linkKindPublicIconSrc(typeNorm),
      label: linkKindDisplayLabel(typeNorm),
      href: link.href,
      external: true,
    };
  }
  return {
    iconSrc: '/images/icons/link-icon.svg',
    label: linkKindDisplayLabel(typeNorm),
    href: link.href,
    external: true,
  };
}

export type ProfileSidebarTransferWallet = {
  asset: 'HIVE' | 'HBD' | 'WAIV';
  iconSrc: string;
  label: string;
};

export const PROFILE_SIDEBAR_TRANSFER_WALLETS: ProfileSidebarTransferWallet[] = [
  {
    asset: 'WAIV',
    iconSrc: '/images/icons/cryptocurrencies/waiv.png',
    label: 'WAIV',
  },
  {
    asset: 'HIVE',
    iconSrc: '/images/icons/cryptocurrencies/hive.png',
    label: 'HIVE',
  },
  {
    asset: 'HBD',
    iconSrc: '/images/icons/cryptocurrencies/hbd-icon.svg',
    label: 'HBD',
  },
];
