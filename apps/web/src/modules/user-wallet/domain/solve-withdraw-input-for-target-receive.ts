export type WithdrawQuoteResult = {
  predictiveAmount: number | null;
  error?: string;
};

export type WithdrawQuoteFetcher = (quantity: string) => Promise<WithdrawQuoteResult>;

const MAX_ITERATIONS = 12;
const RECEIVE_TOLERANCE_RATIO = 0.001;

export type SolveWithdrawInputParams = {
  targetReceive: number;
  maxInput: number;
  fetchQuote: WithdrawQuoteFetcher;
};

export type SolveWithdrawInputResult =
  | { ok: true; quantity: string }
  | { ok: false; reason: 'invalid_target' | 'no_solution' };

function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  return String(value);
}

/**
 * Binary-search input quantity so withdraw quote predictiveAmount ≈ targetReceive.
 */
export async function solveWithdrawInputForTargetReceive(
  params: SolveWithdrawInputParams,
): Promise<SolveWithdrawInputResult> {
  const { targetReceive, maxInput, fetchQuote } = params;
  if (!Number.isFinite(targetReceive) || targetReceive <= 0) {
    return { ok: false, reason: 'invalid_target' };
  }
  if (!Number.isFinite(maxInput) || maxInput <= 0) {
    return { ok: false, reason: 'no_solution' };
  }

  let low = 0;
  let high = maxInput;
  let bestQuantity = '';
  let bestError = Number.POSITIVE_INFINITY;

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    if (mid <= 0) {
      break;
    }
    const quantity = formatQuantity(mid);
    const quote = await fetchQuote(quantity);
    const predicted = quote.predictiveAmount;
    if (predicted === null || quote.error) {
      high = mid;
      continue;
    }
    const error = Math.abs(predicted - targetReceive);
    if (error < bestError) {
      bestError = error;
      bestQuantity = quantity;
    }
    if (error <= targetReceive * RECEIVE_TOLERANCE_RATIO) {
      return { ok: true, quantity };
    }
    if (predicted < targetReceive) {
      low = mid;
    } else {
      high = mid;
    }
  }

  if (bestQuantity && bestError < targetReceive * 0.05) {
    return { ok: true, quantity: bestQuantity };
  }
  return { ok: false, reason: 'no_solution' };
}
