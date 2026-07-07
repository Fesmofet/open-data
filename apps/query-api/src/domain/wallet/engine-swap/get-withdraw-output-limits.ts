export type WithdrawOutputLimits = {
  minimumSwapAmount: number | null;
  minimumReceiveAmount: number | null;
};

export async function getWithdrawOutputLimits(input: {
  fetchEthFee: () => Promise<number | null>;
  fetchBtcMinimum: () => Promise<number | null>;
}): Promise<Record<string, WithdrawOutputLimits>> {
  const [ethFee, btcMinimum] = await Promise.all([
    input.fetchEthFee(),
    input.fetchBtcMinimum(),
  ]);

  return {
    HIVE: { minimumSwapAmount: 0.002, minimumReceiveAmount: null },
    HBD: { minimumSwapAmount: null, minimumReceiveAmount: null },
    LTC: { minimumSwapAmount: null, minimumReceiveAmount: null },
    BTC: { minimumSwapAmount: btcMinimum, minimumReceiveAmount: 0.01 },
    ETH: { minimumSwapAmount: ethFee, minimumReceiveAmount: null },
  };
}

export function attachWithdrawOutputLimits<T extends { outputSymbol: string }>(
  items: readonly T[],
  limits: Readonly<Record<string, WithdrawOutputLimits>>,
): Array<
  T & {
    minimumSwapAmount: number | null;
    minimumReceiveAmount: number | null;
  }
> {
  return items.map((item) => {
    const outputLimits = limits[item.outputSymbol];
    return {
      ...item,
      minimumSwapAmount: outputLimits?.minimumSwapAmount ?? null,
      minimumReceiveAmount: outputLimits?.minimumReceiveAmount ?? null,
    };
  });
}
