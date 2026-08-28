import type { HiveChangellyOutputCoin } from './hive-changelly-withdraw.constants';

const BTC_ADDRESS =
  /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
const LTC_ADDRESS =
  /^(ltc1[ac-hj-np-z02-9]{11,71}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/;
const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function isValidChangellyWithdrawAddress(
  outputCoinType: HiveChangellyOutputCoin,
  address: string,
): boolean {
  const trimmed = address.trim();
  if (!trimmed) {
    return false;
  }
  switch (outputCoinType) {
    case 'btc':
      return BTC_ADDRESS.test(trimmed);
    case 'ltc':
      return LTC_ADDRESS.test(trimmed);
    case 'eth':
      return ETH_ADDRESS.test(trimmed);
    default:
      return false;
  }
}
