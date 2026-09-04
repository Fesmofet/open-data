import { Injectable } from '@nestjs/common';
import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import { NotificationEmitterService } from '../../notification-adapter/notification-emitter.service';
import { emitEngineNotification } from '../emit-engine-notification';
import type { HiveEngineSubParser } from '../hive-engine-sub-parser.interface';
import {
  hiveEngineLogsHaveErrors,
  parseHiveEngineLogs,
} from '../hive-engine-log.util';
import { MARKETPOOLS_CONTRACT, SWAP_TOKENS_ACTION } from '../marketpools-swap.util';

const TOKENS_CONTRACT = 'tokens';
const TRANSFER_ACTION = 'transfer';
const HIVEPEGGED_CONTRACT = 'hivepegged';
const BUY_ACTION = 'buy';

function sameHiveAccount(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Emits engine_transfer / engine_transfer_out for all Hive Engine token transfers
 * and inbound engine_transfer for hivepegged/buy (HIVE → SWAP.HIVE deposits).
 */
@Injectable()
export class EngineTokenTransferParser implements HiveEngineSubParser {
  constructor(
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

  async parseBlock(block: HiveEngineBlock): Promise<void> {
    const txs: HiveEngineTransaction[] = [
      ...block.transactions,
      ...(block.virtualTransactions ?? []),
    ];
    for (const tx of txs) {
      this.processTransaction(block, tx);
    }
  }

  private processTransaction(
    block: HiveEngineBlock,
    tx: HiveEngineTransaction,
  ): void {
    if (hiveEngineLogsHaveErrors(tx)) {
      return;
    }

    if (
      tx.contract === MARKETPOOLS_CONTRACT &&
      tx.action === SWAP_TOKENS_ACTION
    ) {
      return;
    }

    if (tx.contract === TOKENS_CONTRACT && tx.action === TRANSFER_ACTION) {
      this.processTokensTransfer(block, tx);
      return;
    }

    if (tx.contract === HIVEPEGGED_CONTRACT && tx.action === BUY_ACTION) {
      this.processHivepeggedBuy(block, tx);
    }
  }

  private processTokensTransfer(
    block: HiveEngineBlock,
    tx: HiveEngineTransaction,
  ): void {
    const payload = this.parsePayload(tx);
    if (!payload) {
      return;
    }

    const from = tx.sender.trim();
    const to = String(payload.to ?? '').trim();
    if (from === '' || to === '') {
      return;
    }

    const memo = typeof payload.memo === 'string' ? payload.memo : null;
    const events = parseHiveEngineLogs(tx);

    for (const ev of events) {
      if (ev.contract !== TOKENS_CONTRACT || ev.event !== 'transfer') {
        continue;
      }
      const symbol = String(ev.data.symbol ?? '').trim();
      const amount = String(ev.data.quantity ?? '').trim();
      if (symbol === '' || amount === '') {
        continue;
      }

      const transferPayload = { from, to, amount, symbol, memo };
      emitEngineNotification(
        this.notificationEmitter,
        block,
        'engine_transfer',
        from,
        transferPayload,
        tx.transactionId,
      );
      if (!sameHiveAccount(from, to)) {
        emitEngineNotification(
          this.notificationEmitter,
          block,
          'engine_transfer_out',
          from,
          transferPayload,
          tx.transactionId,
        );
      }
    }
  }

  private processHivepeggedBuy(
    block: HiveEngineBlock,
    tx: HiveEngineTransaction,
  ): void {
    const from = tx.sender.trim();
    if (from === '') {
      return;
    }

    const events = parseHiveEngineLogs(tx);
    for (const ev of events) {
      if (ev.contract !== TOKENS_CONTRACT) {
        continue;
      }
      if (ev.event !== 'transfer' && ev.event !== 'issue') {
        continue;
      }

      const symbol = String(ev.data.symbol ?? '').trim();
      const amount = String(ev.data.quantity ?? '').trim();
      const to = String(ev.data.to ?? '').trim();
      if (symbol === '' || amount === '' || to === '') {
        continue;
      }

      emitEngineNotification(
        this.notificationEmitter,
        block,
        'engine_transfer',
        from,
        { from, to, amount, symbol, memo: null },
        tx.transactionId,
      );
    }
  }

  private parsePayload(tx: HiveEngineTransaction): Record<string, unknown> | null {
    try {
      if (typeof tx.payload === 'string') {
        const parsed = JSON.parse(tx.payload) as Record<string, unknown>;
        return Object.keys(parsed).length > 0 ? parsed : null;
      }
      const payload = tx.payload as Record<string, unknown>;
      return payload && Object.keys(payload).length > 0 ? payload : null;
    } catch {
      return null;
    }
  }
}
