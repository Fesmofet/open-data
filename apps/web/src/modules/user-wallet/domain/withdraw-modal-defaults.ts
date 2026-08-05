import type { EngineWithdrawListApiResponse } from '../application/dto/engine-swap-api.schema';

export type WithdrawListToken = EngineWithdrawListApiResponse['tokens'][number];

export function pairKey(token: WithdrawListToken): string {
  return `${token.inputSymbol}:${token.outputSymbol}`;
}

export function findWithdrawPair(
  tokens: readonly WithdrawListToken[],
  inputSymbol: string,
  outputSymbol: string,
): WithdrawListToken | null {
  const input = inputSymbol.trim().toUpperCase();
  const output = outputSymbol.trim().toUpperCase();
  return (
    tokens.find(
      (item) =>
        item.inputSymbol === input && item.outputSymbol === output,
    ) ?? null
  );
}

export function resolveInitialWithdrawSymbols(
  tokens: readonly WithdrawListToken[],
  inputSymbol?: string,
  outputSymbol?: string,
): { inputSymbol: string; outputSymbol: string } {
  if (tokens.length === 0) {
    return { inputSymbol: '', outputSymbol: '' };
  }
  if (inputSymbol?.trim() && outputSymbol?.trim()) {
    const match = findWithdrawPair(tokens, inputSymbol, outputSymbol);
    if (match) {
      return {
        inputSymbol: match.inputSymbol,
        outputSymbol: match.outputSymbol,
      };
    }
  }
  const waivFirst =
    tokens.find((item) => item.inputSymbol === 'WAIV') ?? tokens[0];
  return {
    inputSymbol: waivFirst.inputSymbol,
    outputSymbol: waivFirst.outputSymbol,
  };
}

export type WithdrawInputOption = {
  value: string;
  label: string;
  balance: string;
};

export function uniqueWithdrawInputOptions(
  tokens: readonly WithdrawListToken[],
): WithdrawInputOption[] {
  const byInput = new Map<string, WithdrawInputOption>();
  for (const row of tokens) {
    const key = row.inputSymbol;
    if (!byInput.has(key)) {
      byInput.set(key, {
        value: row.balanceSymbol,
        label: row.inputSymbol,
        balance: row.balance,
      });
    }
  }
  return [...byInput.values()];
}

export function withdrawOutputOptions(
  tokens: readonly WithdrawListToken[],
  inputSymbol: string,
): WithdrawInputOption[] {
  const input = inputSymbol.trim().toUpperCase();
  return tokens
    .filter((row) => row.inputSymbol === input)
    .map((row) => ({
      value: row.outputSymbol,
      label: row.outputSymbol,
      balance: row.balance,
    }));
}
