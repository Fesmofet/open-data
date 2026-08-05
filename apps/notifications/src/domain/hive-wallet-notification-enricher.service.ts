import { vestToHp } from '@opden-data-layer/core/hive-account-history';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import type { HiveChainContextFields } from './hive-global-properties.cache';

const HIVE_WALLET_TYPES = new Set<AnyNotificationEvent['type']>([
  'power_up',
  'power_down',
  'hp_delegation',
]);

function formatHiveDisplayAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '0';
  }
  return value.toFixed(3);
}

function appendHiveSuffix(amount: string): string {
  const trimmed = amount.trim();
  if (trimmed.toUpperCase().endsWith('HIVE')) {
    return trimmed;
  }
  return `${trimmed} HIVE`;
}

export function vestsAmountToHiveLabel(
  vestsAmount: string,
  chain: HiveChainContextFields,
): string {
  const hp = vestToHp(
    vestsAmount,
    chain.totalVestingShares,
    chain.totalVestingFundSteem,
  );
  return `${formatHiveDisplayAmount(hp)} HIVE`;
}

export function needsHiveWalletEnrichment(
  events: readonly AnyNotificationEvent[],
): boolean {
  return events.some((event) => HIVE_WALLET_TYPES.has(event.type));
}

export function enrichHiveWalletNotificationEvent(
  event: AnyNotificationEvent,
  chain: HiveChainContextFields,
): AnyNotificationEvent {
  switch (event.type) {
    case 'power_up': {
      return {
        ...event,
        payload: {
          ...event.payload,
          amount: appendHiveSuffix(event.payload.amount),
        },
      };
    }
    case 'power_down': {
      return {
        ...event,
        payload: {
          ...event.payload,
          amount: vestsAmountToHiveLabel(event.payload.amount, chain),
        },
      };
    }
    case 'hp_delegation': {
      if (event.payload.amount === '0') {
        return event;
      }
      return {
        ...event,
        payload: {
          ...event.payload,
          amount: vestsAmountToHiveLabel(event.payload.amount, chain),
        },
      };
    }
    default:
      return event;
  }
}
