export type PostRewardBeneficiaryInput = {
  account: string;
  weight: number;
};

export type PostRewardInput = {
  pendingPayoutValue: string;
  totalPayoutValue: string;
  curatorPayoutValue: string;
  maxAcceptedPayout: string;
  cashoutTime: string | null;
  percentHbd: number | null;
  promoted?: string | null;
  totalPayoutWaiv: number;
  totalRewardsWaiv: number;
  beneficiaries: PostRewardBeneficiaryInput[];
  jsonMetadata?: string | null;
};

export type PostRewardUsdBreakdown = {
  waivUsd: number;
  hiveUsd: number;
  hbdUsd: number;
  totalUsd: number;
  authorUsd: number;
  curatorUsd: number;
  potentialUsd: number;
  phase: 'potential' | 'paid';
  isPayoutDeclined: boolean;
  payoutLimitHit: boolean;
  promotionCostUsd: number;
  cashoutAt?: string;
  rewardPowerOnly: boolean;
  beneficiaries: Array<{ account: string; percent: number }>;
};

export type PostExpertiseInput = {
  pendingPayoutValue: string;
  totalPayoutValue: string;
  curatorPayoutValue: string;
  maxAcceptedPayout: string;
  totalPayoutWaiv: number;
  totalRewardsWaiv: number;
  createdUnix: number;
};

export type PostObjectExpertiseShare = {
  objectId: string;
  percent: number;
};

export type PostExpertiseDelta = {
  objectId: string;
  delta: number;
};
