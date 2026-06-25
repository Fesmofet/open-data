import type { HiveEngineTransaction } from '@opden-data-layer/clients';
import { hiveEngineLogsHaveErrors } from './hive-engine-log.util';
import { extractSwapFromTransaction } from './marketpools-swap.util';

const TX_BASE = {
  sender: 'nervi',
  transactionId: '00000055a531397a3f21ce26eeac7edbd6fcb731',
  refHiveBlockNumber: 72281607,
};

const SWAP_EVENTS = [
  {
    contract: 'marketpools',
    event: 'swapTokens',
    data: {
      symbolOut: 'SWAP.HIVE',
      symbolIn: 'DEC',
    },
  },
  {
    contract: 'tokens',
    event: 'transferFromContract',
    data: {
      to: 'nervi',
      quantity: '0.25171831',
      symbol: 'SWAP.HIVE',
    },
  },
  {
    contract: 'tokens',
    event: 'transferToContract',
    data: {
      from: 'nervi',
      quantity: '148.48',
      symbol: 'DEC',
    },
  },
];

describe('extractSwapFromTransaction', () => {
  it('extracts atomic swap from legacy-shaped log events', () => {
    const result = extractSwapFromTransaction(TX_BASE, 25283481, 1676318382, SWAP_EVENTS);

    expect(result).toEqual({
      account: 'nervi',
      transactionId: '00000055a531397a3f21ce26eeac7edbd6fcb731',
      blockNumber: 25283481,
      refHiveBlockNumber: 72281607,
      blockTimestampUnix: 1676318382,
      symbolOut: 'SWAP.HIVE',
      symbolIn: 'DEC',
      symbolOutQuantity: '0.25171831',
      symbolInQuantity: '148.48',
    });
  });

  it('returns null when swapTokens event is missing', () => {
    const events = SWAP_EVENTS.filter((e) => e.event !== 'swapTokens');
    expect(extractSwapFromTransaction(TX_BASE, 1, 1, events)).toBeNull();
  });

  it('returns null when transfer events are missing', () => {
    const events = SWAP_EVENTS.filter((e) => !e.event.startsWith('transfer'));
    expect(extractSwapFromTransaction(TX_BASE, 1, 1, events)).toBeNull();
  });

  it('returns null when required quantities are empty', () => {
    const events = SWAP_EVENTS.map((e) =>
      e.event === 'transferFromContract' ?
        { ...e, data: { ...e.data, quantity: '' } }
      : e,
    );
    expect(extractSwapFromTransaction(TX_BASE, 1, 1, events)).toBeNull();
  });
});

describe('hiveEngineLogsHaveErrors', () => {
  it('detects logs.errors', () => {
    const tx = {
      logs: JSON.stringify({ errors: ['failed'], events: [] }),
    } as HiveEngineTransaction;
    expect(hiveEngineLogsHaveErrors(tx)).toBe(true);
  });
});
