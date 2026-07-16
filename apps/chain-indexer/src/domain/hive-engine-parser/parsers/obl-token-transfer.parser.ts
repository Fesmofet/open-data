import { Injectable } from '@nestjs/common';
import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import { OblPaymentAttributionService } from '../../obl-parser/obl-payment-attribution.service';
import type { HiveEngineSubParser } from '../hive-engine-sub-parser.interface';
import {
  hiveEngineLogsHaveErrors,
  parseHiveEngineLogs,
} from '../hive-engine-log.util';

const TOKENS_CONTRACT = 'tokens';
const TRANSFER_ACTION = 'transfer';

/**
 * Indexes WAIV token transfers as OBL payments when a Mutual Ledger exists for the pair.
 *
 * @see docs/spec/obl/payments.md
 */
@Injectable()
export class OblTokenTransferParser implements HiveEngineSubParser {
  constructor(private readonly attribution: OblPaymentAttributionService) {}

  async parseBlock(block: HiveEngineBlock): Promise<void> {
    const txs: HiveEngineTransaction[] = [
      ...block.transactions,
      ...(block.virtualTransactions ?? []),
    ];

    for (let trxIndex = 0; trxIndex < txs.length; trxIndex++) {
      await this.processTransaction(txs[trxIndex], block.refHiveBlockNumber, trxIndex);
    }
  }

  private async processTransaction(
    tx: HiveEngineTransaction,
    refHiveBlockNumber: number,
    trxIndex: number,
  ): Promise<void> {
    if (tx.contract !== TOKENS_CONTRACT || tx.action !== TRANSFER_ACTION) {
      return;
    }
    if (hiveEngineLogsHaveErrors(tx)) {
      return;
    }

    let payloadTo = '';
    try {
      const payload = JSON.parse(tx.payload) as Record<string, unknown>;
      payloadTo = String(payload.to ?? '').trim();
    } catch {
      return;
    }

    const payer = tx.sender.trim();
    const receiver = payloadTo;
    if (payer === '' || receiver === '') {
      return;
    }

    const events = parseHiveEngineLogs(tx);
    for (let logIndex = 0; logIndex < events.length; logIndex++) {
      const ev = events[logIndex];
      if (ev.contract !== TOKENS_CONTRACT || ev.event !== 'transfer') {
        continue;
      }
      const symbol = String(ev.data.symbol ?? '').trim().toUpperCase();
      if (!this.attribution.isTrackedTransferSymbol(symbol)) {
        continue;
      }
      const quantity = parseFloat(String(ev.data.quantity ?? '0'));
      if (!Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }

      await this.attribution.recordTokenTransfer({
        payer,
        receiver,
        symbol,
        quantity,
        transactionId: tx.transactionId,
        refHiveBlockNumber,
        trxIndex,
        logIndex,
      });
    }
  }
}
