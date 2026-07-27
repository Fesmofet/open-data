import { formatWalletModalBalanceDisplay } from './wallet-modal-format';
import type { WalletMainAsset } from './wallet-modal-types';
import { isEngineTokenAsset } from './wallet-modal-types';

export const WAIV_POWER_DOWN_WEEKS = 4;
export const HIVE_POWER_DOWN_WEEKS = 13;

export type PowerDownUnlockMeta = {
  unstakingCooldown: number;
  numberTransactions: number;
};

export function resolveEnginePowerDownMeta(
  source:
    | PowerDownUnlockMeta
    | { unstakingCooldown?: unknown; numberTransactions?: unknown }
    | null
    | undefined,
): PowerDownUnlockMeta | null {
  if (!source) {
    return null;
  }
  const unstakingCooldown = Number(source.unstakingCooldown);
  let numberTransactions = Number(source.numberTransactions);
  if (!Number.isFinite(unstakingCooldown) || unstakingCooldown < 0) {
    return null;
  }
  if (!Number.isFinite(numberTransactions) || numberTransactions <= 0) {
    if (unstakingCooldown >= 7 && unstakingCooldown % 7 === 0) {
      numberTransactions = unstakingCooldown / 7;
    } else if (unstakingCooldown > 0) {
      numberTransactions = 1;
    } else {
      return null;
    }
  }
  return {
    unstakingCooldown: Math.trunc(unstakingCooldown),
    numberTransactions: Math.trunc(numberTransactions),
  };
}

export function getWalletPowerDownWeeks(asset: WalletMainAsset): number {
  if (asset === 'HIVE') {
    return HIVE_POWER_DOWN_WEEKS;
  }
  return WAIV_POWER_DOWN_WEEKS;
}

export function computeWeeklyPowerDownUnlock(
  parsedAmount: number | null,
  weeks: number,
): string | null {
  if (parsedAmount === null || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return null;
  }
  if (!Number.isFinite(weeks) || weeks <= 0) {
    return null;
  }
  const weekly = parsedAmount / weeks;
  return formatWalletModalBalanceDisplay(String(weekly));
}

export function computePowerDownInstallmentAmount(
  parsedAmount: number | null,
  numberTransactions: number,
): string | null {
  if (parsedAmount === null || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return null;
  }
  if (!Number.isFinite(numberTransactions) || numberTransactions <= 0) {
    return null;
  }
  const installment = parsedAmount / numberTransactions;
  return formatWalletModalBalanceDisplay(String(installment));
}

export function computePowerDownPeriodDays(
  unstakingCooldown: number,
  numberTransactions: number,
): number | null {
  if (!Number.isFinite(numberTransactions) || numberTransactions <= 0) {
    return null;
  }
  if (!Number.isFinite(unstakingCooldown) || unstakingCooldown < 0) {
    return null;
  }
  return unstakingCooldown / numberTransactions;
}

export function formatPowerDownPeriodDaysLabel(periodDays: number): string {
  return Number.isInteger(periodDays)
    ? String(periodDays)
    : formatWalletModalBalanceDisplay(String(periodDays));
}

export type FormatPowerDownUnlockPreviewParams = {
  asset: WalletMainAsset;
  parsedAmount: number | null;
  liquidSymbol: string;
  engineMeta?:
    | PowerDownUnlockMeta
    | { unstakingCooldown?: unknown; numberTransactions?: unknown }
    | null;
  translate: (key: string) => string;
  interpolate: (
    template: string,
    values: Record<string, string>,
  ) => string;
};

export function formatPowerDownUnlockPreview(
  params: FormatPowerDownUnlockPreviewParams,
): string {
  const { asset, parsedAmount, liquidSymbol, engineMeta, translate, interpolate } =
    params;

  if (asset === 'HIVE' || asset === 'WAIV') {
    const weeks = getWalletPowerDownWeeks(asset);
    const installment = computeWeeklyPowerDownUnlock(parsedAmount, weeks);
    if (!installment) {
      return '';
    }
    return interpolate(translate('wallet_power_unlock_weekly'), {
      amount: installment,
      symbol: liquidSymbol,
    });
  }

  const resolvedMeta = resolveEnginePowerDownMeta(engineMeta);
  if (isEngineTokenAsset(asset) && resolvedMeta) {
    const installment = computePowerDownInstallmentAmount(
      parsedAmount,
      resolvedMeta.numberTransactions,
    );
    const periodDays = computePowerDownPeriodDays(
      resolvedMeta.unstakingCooldown,
      resolvedMeta.numberTransactions,
    );
    if (!installment || periodDays === null) {
      return '';
    }
    if (periodDays === 7) {
      return interpolate(translate('wallet_power_unlock_weekly'), {
        amount: installment,
        symbol: liquidSymbol,
      });
    }
    return interpolate(translate('wallet_power_unlock_every_days'), {
      amount: installment,
      symbol: liquidSymbol,
      days: formatPowerDownPeriodDaysLabel(periodDays),
    });
  }

  return '';
}
