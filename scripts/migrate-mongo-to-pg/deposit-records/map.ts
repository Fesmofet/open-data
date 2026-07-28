export const CREATE_DEPOSIT_RECORD_OPERATION = 'createDepositRecord';

export type MongoEngineAccountHistoryDeposit = {
  account?: string;
  transactionId?: string;
  refHiveBlockNumber?: number;
  timestamp?: number;
  destination?: string;
  symbolIn?: string;
  symbolOut?: string;
  pair?: string;
  ex_rate?: number;
  depositAccount?: string;
  address?: string;
  memo?: string;
  operation?: string;
};

export type DepositRecordRow = {
  account: string;
  transaction_id: string;
  ref_hive_block_number: number;
  block_timestamp: Date;
  destination: string;
  symbol_in: string;
  symbol_out: string;
  pair: string;
  ex_rate: number;
  deposit_account: string | null;
  address: string | null;
  memo: string | null;
};

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function num(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mongoDepositRecordToRow(
  doc: MongoEngineAccountHistoryDeposit,
): DepositRecordRow | null {
  if (
    doc.operation &&
    doc.operation !== CREATE_DEPOSIT_RECORD_OPERATION
  ) {
    return null;
  }

  const account = str(doc.account);
  const transactionId = str(doc.transactionId);
  const refHiveBlockNumber = num(doc.refHiveBlockNumber);
  const timestampUnix = num(doc.timestamp);
  const destination = str(doc.destination);
  const symbolIn = str(doc.symbolIn);
  const symbolOut = str(doc.symbolOut);
  const pair = str(doc.pair);
  const exRate = num(doc.ex_rate);
  const depositAccount = str(doc.depositAccount) || null;
  const address = str(doc.address) || null;
  const memoRaw = doc.memo;
  const memo =
    memoRaw === undefined || memoRaw === null
      ? null
      : typeof memoRaw === 'string'
        ? memoRaw
        : JSON.stringify(memoRaw);

  if (!depositAccount && !address) {
    return null;
  }
  if (depositAccount && address) {
    return null;
  }

  if (
    !account ||
    !transactionId ||
    refHiveBlockNumber === null ||
    timestampUnix === null ||
    !destination ||
    !symbolIn ||
    !symbolOut ||
    !pair ||
    exRate === null
  ) {
    return null;
  }

  return {
    account,
    transaction_id: transactionId,
    ref_hive_block_number: refHiveBlockNumber,
    block_timestamp: new Date(timestampUnix * 1000),
    destination,
    symbol_in: symbolIn,
    symbol_out: symbolOut,
    pair,
    ex_rate: exRate,
    deposit_account: depositAccount,
    address,
    memo,
  };
}
