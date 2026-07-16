import { OblPaymentAttributionService } from './obl-payment-attribution.service';

describe('OblPaymentAttributionService', () => {
  it('skips token transfer before ledger started', async () => {
    const findLedgerStartedSeq = jest.fn().mockResolvedValue(BigInt(100));
    const findPayment = jest.fn();
    const insertPayment = jest.fn();
    const tokenToUsd = jest.fn();

    const service = new OblPaymentAttributionService(
      {
        findLedgerStartedSeq,
        findPayment,
        insertPayment,
      } as never,
      { tokenToUsd } as never,
    );

    await service.recordTokenTransfer({
      payer: 'alice',
      receiver: 'bob',
      symbol: 'WAIV',
      quantity: 10,
      transactionId: 'he-tx',
      refHiveBlockNumber: 0,
      trxIndex: 0,
      logIndex: 0,
    });

    expect(insertPayment).not.toHaveBeenCalled();
    expect(tokenToUsd).not.toHaveBeenCalled();
  });

  it('deduplicates by payment_id', async () => {
    const findLedgerStartedSeq = jest.fn().mockResolvedValue(BigInt(1));
    const findPayment = jest.fn().mockResolvedValue({ payment_id: 'existing' });
    const insertPayment = jest.fn();

    const service = new OblPaymentAttributionService(
      {
        findLedgerStartedSeq,
        findPayment,
        insertPayment,
      } as never,
      { tokenToUsd: jest.fn() } as never,
    );

    await service.recordTokenTransfer({
      payer: 'alice',
      receiver: 'bob',
      symbol: 'WAIV',
      quantity: 5,
      transactionId: 'he-tx',
      refHiveBlockNumber: 100,
      trxIndex: 0,
      logIndex: 1,
    });

    expect(insertPayment).not.toHaveBeenCalled();
  });
});
