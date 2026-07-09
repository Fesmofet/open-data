export type UserAccountSidebarWaivView = {
  upvotingManaPercent: number;
  downvotingManaPercent: number;
  voteValueUsd: number;
};

export type UserAccountSidebarHiveView = {
  reputation: number;
  upvotingManaPercent: number;
  downvotingManaPercent: number;
  resourceCreditsPercent: number;
  voteValueUsd: number;
};

export type UserAccountSidebarSocialLink = {
  type: string;
  value: string;
  href: string;
};

export type UserAccountSidebarCryptoWallet = {
  id: string;
  label: string;
  shortName: string;
  abbreviation: string;
  address: string;
  icon: string;
  coingeckoId: string;
};

export type UserAccountSidebarView = {
  about: string;
  location: string | null;
  website: string | null;
  email: string | null;
  joinedAt: string | null;
  expertiseWeight: number;
  lastActivityAt: string | null;
  totalVoteValueUsd: number;
  socialLinks: UserAccountSidebarSocialLink[];
  cryptoWallets: UserAccountSidebarCryptoWallet[];
  waiv: UserAccountSidebarWaivView;
  hive: UserAccountSidebarHiveView;
};
