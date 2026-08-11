import type { HiveEngineTokenBalance } from '@opden-data-layer/clients';

const ZERO = '0';
export const WAIV_POWER_DOWN_WEEKS_TOTAL = 4;

export type WaivWalletRates = {
  waivHive: number;
  waivUsd: number;
};

export type WaivWalletBalanceFields = {
  liquid: string;
  stake: string;
  delegationsIn: string;
  delegationsOut: string;
  pendingUnstake: string;
  pendingUndelegations: string;
};

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(value: number, fractionDigits = 3): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

function formatSignedAmount(value: number, fractionDigits = 3): string {
  if (value === 0) {
    return '0';
  }
  const abs = formatAmount(Math.abs(value), fractionDigits);
  if (value > 0) {
    return `+${abs}`;
  }
  return `-${abs}`;
}

export function emptyWaivBalance(): WaivWalletBalanceFields {
  return {
    liquid: ZERO,
    stake: ZERO,
    delegationsIn: ZERO,
    delegationsOut: ZERO,
    pendingUnstake: ZERO,
    pendingUndelegations: ZERO,
  };
}

export function mapTokenBalanceRow(
  row: HiveEngineTokenBalance | null,
): WaivWalletBalanceFields {
  if (!row) {
    return emptyWaivBalance();
  }
  return {
    liquid: row.balance,
    stake: row.stake,
    delegationsIn: row.delegationsIn,
    delegationsOut: row.delegationsOut,
    pendingUnstake: row.pendingUnstake,
    pendingUndelegations: row.pendingUndelegations,
  };
}

export function calculateWaivPowerDownWeeksRemaining(
  numberTransactionsLeft: number | null | undefined,
): number {
  if (
    numberTransactionsLeft === null ||
    numberTransactionsLeft === undefined ||
    !Number.isFinite(numberTransactionsLeft)
  ) {
    return WAIV_POWER_DOWN_WEEKS_TOTAL;
  }
  return Math.min(
    WAIV_POWER_DOWN_WEEKS_TOTAL,
    Math.max(0, Math.trunc(numberTransactionsLeft)),
  );
}

export function buildWaivWalletSummary(
  balance: WaivWalletBalanceFields,
  rates: WaivWalletRates,
  nextUnstakeAt: number | null,
  numberTransactionsLeft: number | null = null,
) {
  const liquid = parseAmount(balance.liquid);
  const stake = parseAmount(balance.stake);
  const delegationsIn = parseAmount(balance.delegationsIn);
  const delegationsOut = parseAmount(balance.delegationsOut);
  const pendingUnstake = parseAmount(balance.pendingUnstake);
  const pendingUndelegations = parseAmount(balance.pendingUndelegations);

  const waivPowerValue = stake + delegationsOut;
  const delegationsNetValue =
    delegationsIn - delegationsOut - pendingUndelegations;
  const delegationsNetRounded =
    Math.abs(delegationsNetValue) < 1e-9 ? 0 : delegationsNetValue;
  const estUsd =
    rates.waivUsd *
    (liquid + stake + pendingUnstake + delegationsOut);

  const showDelegationsRow =
    delegationsNetRounded !== 0 || pendingUndelegations > 0;
  const showPowerDownRow = pendingUnstake > 0;

  return {
    balance,
    display: {
      liquidWaiv: formatAmount(liquid),
      waivPower: formatAmount(waivPowerValue),
      delegationsNet: formatSignedAmount(delegationsNetRounded),
      estAccountValueUsd: formatAmount(estUsd, 2),
    },
    flags: {
      showDelegationsRow,
      showPowerDownRow,
    },
    powerDown: showPowerDownRow
      ? {
          nextUnstakeAt,
          weeksRemaining: calculateWaivPowerDownWeeksRemaining(numberTransactionsLeft),
          weeksTotal: WAIV_POWER_DOWN_WEEKS_TOTAL,
        }
      : undefined,
  };
}
