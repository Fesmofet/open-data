import { EventEmitter2 } from '@nestjs/event-emitter';
import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import {
  USER_OBJECT_POWERS_UPDATE_EVENT,
  UserObjectPowersUpdateEvent,
} from '../../user-object-powers/user-object-powers.events';
import { WaivStakeParser } from './waiv-stake.parser';

function tx(
  partial: Partial<HiveEngineTransaction> & Pick<HiveEngineTransaction, 'action'>,
): HiveEngineTransaction {
  return {
    refHiveBlockNumber: 1,
    transactionId: 'tx-id',
    sender: 'flowmaster',
    contract: 'tokens',
    payload: '{}',
    executedCodeHash: '',
    hash: '',
    databaseHash: '',
    logs: '{}',
    ...partial,
  };
}

const blockBase = {
  blockNumber: 1,
  refHiveBlockNumber: 1,
  timestamp: '2024-01-01T00:00:00',
  virtualTransactions: [],
} as unknown as HiveEngineBlock;

describe('WaivStakeParser', () => {
  let parser: WaivStakeParser;
  let powerEmit: jest.Mock;
  let notifyEmit: jest.Mock;

  beforeEach(() => {
    powerEmit = jest.fn();
    notifyEmit = jest.fn();
    parser = new WaivStakeParser(
      { emit: powerEmit } as unknown as EventEmitter2,
      { emit: notifyEmit } as unknown as import('../../notification-adapter/notification-emitter.service').NotificationEmitterService,
    );
  });

  it('does not emit engine_transfer for tokens/transfer', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'transfer',
          sender: 'flowmaster',
          payload: JSON.stringify({ to: 'bob', symbol: 'WAIV', quantity: '1' }),
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'WAIV', quantity: '1.00000000' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('emits +quantity for stake from stake log event', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'stake',
          sender: 'flowmaster',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'stake',
                data: {
                  account: 'flowmaster',
                  quantity: '2.00000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('flowmaster', 2),
    );
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_stake',
        actor: 'flowmaster',
        payload: expect.objectContaining({
          from: 'flowmaster',
          to: 'flowmaster',
          amount: '2',
          symbol: 'WAIV',
        }),
      }),
    );
  });

  it('does not emit when stake tx has no WAIV log events', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [tx({ action: 'stake', logs: JSON.stringify({ events: [] }) })],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).not.toHaveBeenCalled();
    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('does not emit when stake tx has invalid logs', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [tx({ action: 'stake', logs: 'not-json' })],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).not.toHaveBeenCalled();
    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('emits delegate deltas and notification from delegate log event', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'delegate',
          sender: 'flowmaster',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'delegate',
                data: {
                  to: 'wiv01',
                  quantity: '0.10000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('flowmaster', -0.1),
    );
    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('wiv01', 0.1),
    );
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_delegate',
        actor: 'flowmaster',
        payload: {
          from: 'flowmaster',
          to: 'wiv01',
          amount: '0.1',
          symbol: 'WAIV',
        },
      }),
    );
  });

  it('emits undelegate notification with delegator as actor', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'undelegate',
          sender: 'flowmaster',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'undelegateStart',
                data: {
                  from: 'wiv01',
                  quantity: '0.50000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('wiv01', -0.5),
    );
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_undelegate',
        actor: 'flowmaster',
        payload: {
          from: 'flowmaster',
          to: 'wiv01',
          amount: '0.5',
          symbol: 'WAIV',
        },
      }),
    );
  });

  it('emits engine_unstake on unstakeStart without power delta', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'unstake',
          sender: 'flowmaster',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'unstakeStart',
                data: {
                  account: 'flowmaster',
                  quantity: '1.00000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).not.toHaveBeenCalled();
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_unstake',
        actor: 'flowmaster',
        payload: {
          account: 'flowmaster',
          amount: '1',
          symbol: 'WAIV',
        },
      }),
    );
  });

  it('emits power delta only for virtual checkPendingUnstakes unstake', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [],
      virtualTransactions: [
        tx({
          action: 'checkPendingUnstakes',
          sender: 'null',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'unstake',
                data: {
                  account: 'flowmaster',
                  quantity: '1.00000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('flowmaster', -1),
    );
    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('emits multiple unstake deltas from one virtual tx', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [],
      virtualTransactions: [
        tx({
          action: 'checkPendingUnstakes',
          sender: 'null',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'unstake',
                data: {
                  account: 'alice',
                  quantity: '2.00000000',
                  symbol: 'WAIV',
                },
              },
              {
                contract: 'tokens',
                event: 'unstake',
                data: {
                  account: 'bob',
                  quantity: '3.00000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('alice', -2),
    );
    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('bob', -3),
    );
    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('emits +quantity for undelegateDone from virtual checkPendingUndelegations tx', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [],
      virtualTransactions: [
        tx({
          action: 'checkPendingUndelegations',
          sender: 'null',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'undelegateDone',
                data: {
                  account: 'flowmaster',
                  quantity: '0.50000000',
                  symbol: 'WAIV',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).toHaveBeenCalledWith(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent('flowmaster', 0.5),
    );
    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('ignores non-WAIV log events', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'stake',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'stake',
                data: {
                  account: 'flowmaster',
                  quantity: '2.00000000',
                  symbol: 'BEE',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(powerEmit).not.toHaveBeenCalled();
    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('falls back to payload for unstake when logs are empty', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          action: 'unstake',
          sender: 'flowmaster',
          payload: JSON.stringify({
            quantity: '0.00100000',
            symbol: 'WAIV',
          }),
          logs: JSON.stringify({ events: [] }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_unstake',
        actor: 'flowmaster',
      }),
    );
  });
});
