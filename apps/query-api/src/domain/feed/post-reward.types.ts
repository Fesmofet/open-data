import type { SupportedCurrency } from '@opden-data-layer/core';

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
  jsonMetadata: string | null | undefined;
};

export type MoneyLineDto = {
  amount: number;
  currency: string;
  label: string;
};

export type PostRewardBeneficiaryDto = {
  account: string;
  percent: number;
  payout?: MoneyLineDto;
};

export type PostRewardBreakdownDto = {
  waiv: MoneyLineDto;
  hive: MoneyLineDto;
  hbd: MoneyLineDto;
  total: MoneyLineDto;
  authorPayout?: MoneyLineDto;
  curatorPayout?: MoneyLineDto;
};

export type PostRewardDto = {
  amount: number;
  currency: SupportedCurrency;
  label: string;
  phase: 'potential' | 'paid';
  breakdown: PostRewardBreakdownDto;
  beneficiaries?: PostRewardBeneficiaryDto[];
  cashoutAt?: string;
  isPayoutDeclined?: boolean;
  payoutLimitHit?: boolean;
  promotionCost?: MoneyLineDto;
  rewardPowerOnly?: boolean;
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
