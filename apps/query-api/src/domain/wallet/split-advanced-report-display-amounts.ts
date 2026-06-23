import { HIVE_OP, vestToHp, type HiveAssetLike } from '@opden-data-layer/core/hive-account-history';

import type { AdvancedReportRawRow } from './hive-advanced-report-pager.service';

export type AdvancedReportDisplayAmounts = {
  hiveAmount: string;
  hbdAmount: string;
  hpAmount: string;
};

export type AdvancedReportDisplayRow = Pick<
  AdvancedReportRawRow,
  'type' | 'amount' | 'from' | 'to' | 'payload'
> & {
  withdrawDeposit: '' | 'd' | 'w';
};

type ChainContext = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseAsset(raw: string): { amount: string; currency: string } | null {
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }
  return { amount: parts[0] ?? '', currency: (parts[1] ?? '').toUpperCase() };
}

function formatDisplayAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '';
  }
  return value.toFixed(3);
}

export function toVestPayload(value: unknown): HiveAssetLike | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (value && typeof value === 'object' && 'amount' in value) {
    return value as HiveAssetLike;
  }
  return null;
}

function vestsToHpDisplay(
  vests: HiveAssetLike | null,
  chainContext: ChainContext,
): string {
  if (!vests) {
    return '';
  }
  return formatDisplayAmount(
    vestToHp(
      vests,
      chainContext.totalVestingShares,
      chainContext.totalVestingFundSteem,
    ),
  );
}

function assignByCurrency(
  asset: { amount: string; currency: string } | null,
  out: AdvancedReportDisplayAmounts,
  chainContext: ChainContext,
): void {
  if (!asset?.amount) {
    return;
  }
  if (asset.currency === 'HBD') {
    out.hbdAmount = asset.amount;
    return;
  }
  if (asset.currency.includes('VESTS')) {
    out.hpAmount = vestsToHpDisplay(`${asset.amount} ${asset.currency}`, chainContext);
    return;
  }
  if (asset.currency === 'HIVE') {
    out.hiveAmount = asset.amount;
  }
}

export function splitAdvancedReportDisplayAmounts(
  row: AdvancedReportDisplayRow,
  chainContext: ChainContext,
): AdvancedReportDisplayAmounts {
  const out: AdvancedReportDisplayAmounts = {
    hiveAmount: '',
    hbdAmount: '',
    hpAmount: '',
  };

  if (row.type === HIVE_OP.CLAIM_REWARD_BALANCE) {
    const p = row.payload;
    const hive = parseAsset(asString(p.reward_hive));
    const hbd = parseAsset(asString(p.reward_hbd));
    if (hive?.amount && Number(hive.amount) !== 0) {
      out.hiveAmount = hive.amount;
    }
    if (hbd?.amount && Number(hbd.amount) !== 0) {
      out.hbdAmount = hbd.amount;
    }
    out.hpAmount = vestsToHpDisplay(toVestPayload(p.reward_vests), chainContext);
    return out;
  }

  if (row.type === HIVE_OP.FILL_ORDER || row.type === HIVE_OP.LIMIT_ORDER_CANCEL) {
    const [left = '', right = ''] = row.amount.split('/').map((p) => p.trim());
    assignByCurrency(parseAsset(left), out, chainContext);
    assignByCurrency(parseAsset(right), out, chainContext);
    return out;
  }

  const asset = parseAsset(row.amount);

  if (row.type === HIVE_OP.TRANSFER_TO_VESTING) {
    if (row.withdrawDeposit === 'd' && asset?.amount) {
      out.hpAmount = asset.amount;
    } else if (row.withdrawDeposit === 'w' && asset?.amount) {
      out.hiveAmount = `-${asset.amount}`;
    }
    return out;
  }

  if (row.type === HIVE_OP.FILL_VESTING_WITHDRAW) {
    if (asset?.amount) {
      out.hpAmount = asset.amount;
    }
    return out;
  }

  if (!asset) {
    return out;
  }

  if (asset.currency === 'HBD') {
    out.hbdAmount = asset.amount;
  } else if (asset.currency.includes('VESTS')) {
    out.hpAmount = vestsToHpDisplay(row.amount, chainContext);
  } else {
    out.hiveAmount = asset.amount;
  }

  return out;
}
