import { OblTokenTransferParser } from './obl-token-transfer.parser';

describe('OblTokenTransferParser', () => {
  it('records WAIV transfer via attribution service', async () => {
    const recordTokenTransfer = jest.fn().mockResolvedValue(undefined);
    const attribution = {
      isTrackedTransferSymbol: (s: string) => s === 'WAIV',
      recordTokenTransfer,
    };
    const parser = new OblTokenTransferParser(attribution as never);

    await parser.parseBlock({
      refHiveBlockNumber: 500,
      transactions: [
        {
          contract: 'tokens',
          action: 'transfer',
          sender: 'alice',
          transactionId: 'he-1',
          payload: JSON.stringify({ to: 'bob', symbol: 'WAIV', quantity: '1.5' }),
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'WAIV', quantity: '1.50000000' },
              },
            ],
          }),
        },
      ],
      virtualTransactions: [],
    } as never);

    expect(recordTokenTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        payer: 'alice',
        receiver: 'bob',
        symbol: 'WAIV',
        quantity: 1.5,
      }),
    );
  });

  it('ignores non-WAIV symbols', async () => {
    const recordTokenTransfer = jest.fn();
    const attribution = {
      isTrackedTransferSymbol: () => false,
      recordTokenTransfer,
    };
    const parser = new OblTokenTransferParser(attribution as never);

    await parser.parseBlock({
      refHiveBlockNumber: 500,
      transactions: [
        {
          contract: 'tokens',
          action: 'transfer',
          sender: 'alice',
          transactionId: 'he-2',
          payload: JSON.stringify({ to: 'bob', symbol: 'HBD', quantity: '1' }),
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'HBD', quantity: '1.00000000' },
              },
            ],
          }),
        },
      ],
      virtualTransactions: [],
    } as never);

    expect(recordTokenTransfer).not.toHaveBeenCalled();
  });
});
