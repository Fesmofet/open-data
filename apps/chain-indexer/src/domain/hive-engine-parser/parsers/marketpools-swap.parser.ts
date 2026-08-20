import { Injectable, Logger } from '@nestjs/common';
import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import { NewHiveEngineSwap } from '@opden-data-layer/odl-db-types';

import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';
import { HiveEngineSwapsRepository } from '../../../repositories/hive-engine-swaps.repository';
import type { HiveEngineSubParser } from '../hive-engine-sub-parser.interface';
import {
  hiveEngineLogsHaveErrors,
  parseHiveEngineLogs,
} from '../hive-engine-log.util';
import {
  extractSwapFromTransaction,
  MARKETPOOLS_CONTRACT,
  SWAP_TOKENS_ACTION,
} from '../marketpools-swap.util';

/**
 * Indexes atomic market-pool swaps from Hive Engine `marketpools` contract logs.
 *
 * @see docs/apps/chain-indexer/spec/hive-engine-swaps.md
 */
@Injectable()
export class MarketpoolsSwapParser implements HiveEngineSubParser {
  private readonly logger = new Logger(MarketpoolsSwapParser.name);

  constructor(private readonly hiveEngineSwapsRepository: HiveEngineSwapsRepository) {}

  async parseBlock(block: HiveEngineBlock): Promise<void> {
    const txs: HiveEngineTransaction[] = [
      ...block.transactions,
      ...(block.virtualTransactions ?? []),
    ];
    const swapTxs = txs.filter(
      (tx) => tx.contract === MARKETPOOLS_CONTRACT && tx.action === SWAP_TOKENS_ACTION,
    );
    if (swapTxs.length === 0) {
      return;
    }

    const blockTimestampUnix = blockTimestampFromBlock(block);
    const rows: NewHiveEngineSwap[] = [];

    for (const tx of swapTxs) {
      if (hiveEngineLogsHaveErrors(tx)) {
        continue;
      }
      const events = parseHiveEngineLogs(tx);
      if (events.length === 0) {
        continue;
      }

      const parsed = extractSwapFromTransaction(
        tx,
        block.blockNumber,
        blockTimestampUnix,
        events,
      );
      if (!parsed) {
        continue;
      }

      rows.push({
        account: parsed.account,
        transaction_id: parsed.transactionId,
        block_number: parsed.blockNumber,
        ref_hive_block_number: parsed.refHiveBlockNumber,
        block_timestamp: new Date(parsed.blockTimestampUnix * 1000),
        symbol_out: parsed.symbolOut,
        symbol_in: parsed.symbolIn,
        symbol_out_quantity: parsed.symbolOutQuantity,
        symbol_in_quantity: parsed.symbolInQuantity,
      });
    }

    if (rows.length === 0) {
      return;
    }

    try {
      await this.hiveEngineSwapsRepository.insertSwapsBatch(rows);
    } catch (e) {
      this.logger.error(
        `Failed to persist swaps for block ${block.blockNumber}: ${(e as Error).message}`,
      );
      throw e;
    }
  }
}

function blockTimestampFromBlock(block: HiveEngineBlock): number {
  const blockTimestampUnix = blockTimestampToUnixSeconds(block.timestamp);
  return blockTimestampUnix > 0
    ? blockTimestampUnix
    : Math.floor(Date.now() / 1000);
}
