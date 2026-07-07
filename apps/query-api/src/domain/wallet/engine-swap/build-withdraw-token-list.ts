import type {
  HiveEngineConverterCoin,
  HiveEngineConverterPair,
} from '@opden-data-layer/clients';

const WAIV_WITHDRAW_OUTPUTS = ['LTC', 'BTC', 'ETH', 'HBD', 'HIVE'] as const;

export type WithdrawTokenListItem = {
  inputSymbol: string;
  outputSymbol: string;
  balanceSymbol: string;
  displayName: string;
  label: string;
  balance: string;
  precision: number;
  requiresExternalAddress: boolean;
};

export type WithdrawPairDefinition = Omit<
  WithdrawTokenListItem,
  'balance' | 'precision'
>;

export function buildWithdrawPairDefinitions(
  pairs: readonly HiveEngineConverterPair[],
  coins: readonly HiveEngineConverterCoin[],
): WithdrawPairDefinition[] {
  const coinBySymbol = new Map(
    coins.map((coin) => [coin.symbol.toUpperCase(), coin.display_name]),
  );
  const byKey = new Map<string, WithdrawPairDefinition>();

  const add = (item: WithdrawPairDefinition) => {
    byKey.set(`${item.inputSymbol}:${item.outputSymbol}`, item);
  };

  for (const pair of pairs) {
    const inputSymbol = pair.from_coin_symbol?.trim().toUpperCase();
    const outputSymbol = pair.to_coin_symbol?.trim().toUpperCase();
    if (!inputSymbol || !outputSymbol) {
      continue;
    }
    if (!inputSymbol.startsWith('SWAP') || outputSymbol.startsWith('SWAP')) {
      continue;
    }
    add({
      inputSymbol,
      outputSymbol,
      balanceSymbol: inputSymbol,
      displayName: coinBySymbol.get(inputSymbol) ?? inputSymbol,
      label: inputSymbol,
      requiresExternalAddress: !['HIVE', 'HBD'].includes(outputSymbol),
    });
  }

  add({
    inputSymbol: 'SWAP.HIVE',
    outputSymbol: 'HIVE',
    balanceSymbol: 'SWAP.HIVE',
    displayName: coinBySymbol.get('SWAP.HIVE') ?? 'SWAP.HIVE',
    label: 'SWAP.HIVE',
    requiresExternalAddress: false,
  });

  add({
    inputSymbol: 'SWAP.ETH',
    outputSymbol: 'ETH',
    balanceSymbol: 'SWAP.ETH',
    displayName: coinBySymbol.get('SWAP.ETH') ?? 'SWAP.ETH',
    label: 'SWAP.ETH',
    requiresExternalAddress: true,
  });

  for (const outputSymbol of WAIV_WITHDRAW_OUTPUTS) {
    add({
      inputSymbol: 'WAIV',
      outputSymbol,
      balanceSymbol: 'WAIV',
      displayName: coinBySymbol.get('WAIV') ?? 'WAIV',
      label: `WAIV - ${outputSymbol}`,
      requiresExternalAddress: !['HIVE', 'HBD'].includes(outputSymbol),
    });
  }

  return [...byKey.values()];
}

export function buildWithdrawTokenList(input: {
  pairs: readonly HiveEngineConverterPair[];
  coins: readonly HiveEngineConverterCoin[];
  balances: ReadonlyMap<string, string>;
  precisionBySymbol: ReadonlyMap<string, number>;
}): WithdrawTokenListItem[] {
  const definitions = buildWithdrawPairDefinitions(input.pairs, input.coins);

  const items = definitions
    .map((definition) => {
      const balance = input.balances.get(definition.balanceSymbol) ?? '0';
      return {
        ...definition,
        balance,
        precision: input.precisionBySymbol.get(definition.balanceSymbol) ?? 8,
      };
    })
    .filter((item) => Number.parseFloat(item.balance) > 0);

  items.sort((a, b) => {
    if (a.balanceSymbol === 'WAIV') {
      return -1;
    }
    if (b.balanceSymbol === 'WAIV') {
      return 1;
    }
    const balanceDiff = Number.parseFloat(b.balance) - Number.parseFloat(a.balance);
    if (balanceDiff !== 0) {
      return balanceDiff;
    }
    return a.label.localeCompare(b.label);
  });

  return items;
}

export function isSupportedWithdrawPair(
  items: readonly WithdrawTokenListItem[],
  inputSymbol: string,
  outputSymbol: string,
): boolean {
  const normalizedInput = inputSymbol.trim().toUpperCase();
  const normalizedOutput = outputSymbol.trim().toUpperCase();
  return items.some(
    (item) =>
      item.inputSymbol === normalizedInput &&
      item.outputSymbol === normalizedOutput,
  );
}
