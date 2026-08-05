import { Injectable } from '@nestjs/common';
import {
  HiveEngineClient,
  HiveEngineConvertClient,
  TribaldexClient,
  type HiveEngineMarketPool,
} from '@opden-data-layer/clients';
import {
  isEngineDisabledPeggedSwapSymbol,
  isEngineDisabledWithdrawL1Symbol,
} from '@opden-data-layer/core/hive-engine-history';

import {
  AVAILABLE_TOKEN_WITHDRAW,
  DEFAULT_TRADE_FEE_MUL,
  DEFAULT_WITHDRAW_SLIPPAGE,
  DEFAULT_WITHDRAW_SLIPPAGE_MAX,
} from './engine-swap.constants';
import {
  buildPoolsByPair,
  executeSwapSequence,
  fixedEngineAmount,
  type SwapHopInput,
} from './execute-swap-sequence';
import {
  validateHiveWithdrawAmount,
  validateWithdrawOutputAmount,
  type WithdrawAmountValidation,
  type WithdrawValidationErrorCode,
} from './validate-withdraw-amount';

export type HivePeggedWithdrawPayload = {
  contractName: 'hivepegged';
  contractAction: 'withdraw';
  contractPayload: { quantity: string };
};

export type TokensTransferWithdrawPayload = {
  contractName: 'tokens';
  contractAction: 'transfer';
  contractPayload: {
    symbol: string;
    to: string;
    quantity: string;
    memo: string;
  };
};

export type MarketpoolsSwapPayload = {
  contractName: 'marketpools';
  contractAction: 'swapTokens';
  contractPayload: Record<string, string>;
};

export type EngineWithdrawCustomJsonPayload =
  | HivePeggedWithdrawPayload
  | TokensTransferWithdrawPayload
  | MarketpoolsSwapPayload;

type EngineWithdrawQuoteResult = {
  predictiveAmount: number | null;
  customJsonPayload: EngineWithdrawCustomJsonPayload[];
  error?: string;
  errorCode?: WithdrawValidationErrorCode;
  errorParams?: Record<string, string | number>;
};

function quoteFromValidation(
  validation: WithdrawAmountValidation,
  customJsonPayload: EngineWithdrawCustomJsonPayload[] = [],
): EngineWithdrawQuoteResult {
  return {
    predictiveAmount: validation.predictiveAmount,
    customJsonPayload: validation.error ? [] : customJsonPayload,
    error: validation.error ?? undefined,
    errorCode: validation.errorCode,
    errorParams: validation.errorParams,
  };
}

function unsupportedWithdrawPair(): EngineWithdrawQuoteResult {
  return {
    predictiveAmount: null,
    customJsonPayload: [],
    error: 'unsupported withdraw pair',
  };
}

function indirectWithdrawSwap(input: {
  quantity: string;
  poolsByPair: ReadonlyMap<string, HiveEngineMarketPool>;
  tradeFeeMul: string;
  tokenPairs: string[];
  exchangeSequence: string[];
}):
  | {
      swapJson: string[];
      amount: string;
      amntOut: string;
      predictionImpact: string;
    }
  | { error: string } {
  const hops: SwapHopInput[] = input.tokenPairs.map((tokenPair, index) => ({
    tokenPair,
    inputSymbol: input.exchangeSequence[index] ?? '',
  }));
  const result = executeSwapSequence({
    hops,
    amountIn: input.quantity,
    poolsByPair: input.poolsByPair,
    tradeFeeMul: input.tradeFeeMul,
    slippageFirst: DEFAULT_WITHDRAW_SLIPPAGE,
    slippageRest: DEFAULT_WITHDRAW_SLIPPAGE_MAX,
  });
  if ('error' in result) {
    return result;
  }
  return {
    swapJson: result.swapJson,
    amount: result.minAmountOut,
    amntOut: result.amountOut,
    predictionImpact: result.priceImpact,
  };
}

@Injectable()
export class EngineWithdrawQuoteService {
  constructor(
    private readonly hiveEngine: HiveEngineClient,
    private readonly convertClient: HiveEngineConvertClient,
    private readonly tribaldexClient: TribaldexClient,
  ) {}

  private async resolveTradeFeeMul(): Promise<string> {
    const params = await this.hiveEngine.findOneMarketPoolParam();
    return params?.tradeFeeMul ?? DEFAULT_TRADE_FEE_MUL;
  }

  private parseCustomJson(json: string): EngineWithdrawCustomJsonPayload {
    return JSON.parse(json) as EngineWithdrawCustomJsonPayload;
  }

  private buildSwapData(input: {
    quantity: string;
    inputSymbol: string;
    outputSymbol: string;
    poolsByPair: ReadonlyMap<string, HiveEngineMarketPool>;
    tradeFeeMul: string;
  }):
    | {
        swapJson: string[];
        amount: string;
      }
    | { error: string } {
    if (input.outputSymbol === 'HIVE') {
      const result = executeSwapSequence({
        hops: [{ tokenPair: 'SWAP.HIVE:WAIV', inputSymbol: input.inputSymbol }],
        amountIn: input.quantity,
        poolsByPair: input.poolsByPair,
        tradeFeeMul: input.tradeFeeMul,
        slippageFirst: DEFAULT_WITHDRAW_SLIPPAGE,
      });
      if ('error' in result) {
        return result;
      }
      return { swapJson: result.swapJson, amount: result.minAmountOut };
    }

    const routes: Record<
      string,
      { tokenPairs: string[]; exchangeSequence: string[] }
    > = {
      BTC: {
        tokenPairs: ['SWAP.HIVE:WAIV', 'SWAP.HIVE:SWAP.BTC'],
        exchangeSequence: ['WAIV', 'SWAP.HIVE'],
      },
      HBD: {
        tokenPairs: ['SWAP.HIVE:WAIV', 'SWAP.HIVE:SWAP.HBD'],
        exchangeSequence: ['WAIV', 'SWAP.HIVE'],
      },
      LTC: {
        tokenPairs: ['SWAP.HIVE:WAIV', 'SWAP.HIVE:SWAP.LTC'],
        exchangeSequence: ['WAIV', 'SWAP.HIVE'],
      },
    };

    const route = routes[input.outputSymbol];
    if (!route) {
      return { error: 'unsupported output' };
    }

    const result = indirectWithdrawSwap({
      quantity: input.quantity,
      poolsByPair: input.poolsByPair,
      tradeFeeMul: input.tradeFeeMul,
      tokenPairs: route.tokenPairs,
      exchangeSequence: route.exchangeSequence,
    });
    if ('error' in result) {
      return result;
    }
    return { swapJson: result.swapJson, amount: result.amount };
  }

  private async buildWithdrawPayload(input: {
    address: string;
    outputSymbol: string;
    amount: string;
  }): Promise<
    | { withdraw: EngineWithdrawCustomJsonPayload }
    | { error: string }
  > {
    if (input.outputSymbol === 'HIVE') {
      return {
        withdraw: {
          contractName: 'hivepegged',
          contractAction: 'withdraw',
          contractPayload: { quantity: fixedEngineAmount(input.amount, 3) },
        },
      };
    }

    const swapSymbol = AVAILABLE_TOKEN_WITHDRAW[input.outputSymbol];
    if (!swapSymbol) {
      return { error: `unsupported output symbol ${input.outputSymbol}` };
    }

    const convert = await this.convertClient.convert({
      destination: input.address,
      from_coin: swapSymbol,
      to_coin: input.outputSymbol,
    });
    if (!convert || convert.error) {
      return { error: convert?.error ?? 'convert failed' };
    }
    const to = convert.account;
    const memo = convert.memo;
    if (!to || !memo) {
      return { error: 'convert returned incomplete routing data' };
    }

    return {
      withdraw: {
        contractName: 'tokens',
        contractAction: 'transfer',
        contractPayload: {
          symbol: swapSymbol,
          to,
          quantity: input.amount,
          memo,
        },
      },
    };
  }

  async quote(input: {
    account: string;
    quantity: string;
    inputSymbol: string;
    outputSymbol: string;
    address?: string;
    previewOnly?: boolean;
  }): Promise<EngineWithdrawQuoteResult> {
    const inputSymbol = input.inputSymbol.trim().toUpperCase();
    const outputSymbol = input.outputSymbol.trim().toUpperCase();
    const address = input.address?.trim() ?? '';
    const previewOnly = input.previewOnly ?? !address;

    if (
      isEngineDisabledPeggedSwapSymbol(inputSymbol) ||
      isEngineDisabledWithdrawL1Symbol(outputSymbol)
    ) {
      return unsupportedWithdrawPair();
    }

    if (inputSymbol === 'WAIV') {
      return this.quoteWaivWithdraw({
        ...input,
        inputSymbol,
        outputSymbol,
        address,
        previewOnly,
      });
    }

    return this.quoteDirectSwapWithdraw({
      ...input,
      inputSymbol,
      outputSymbol,
      address,
      previewOnly,
    });
  }

  private async quoteDirectSwapWithdraw(input: {
    quantity: string;
    inputSymbol: string;
    outputSymbol: string;
    address: string;
    previewOnly: boolean;
  }): Promise<EngineWithdrawQuoteResult> {
    if (input.inputSymbol === 'SWAP.HIVE' && input.outputSymbol === 'HIVE') {
      const validation = validateHiveWithdrawAmount(input.quantity);
      if (validation.error) {
        return quoteFromValidation(validation);
      }
      if (input.previewOnly) {
        return {
          predictiveAmount: validation.predictiveAmount,
          customJsonPayload: [],
        };
      }
      return {
        predictiveAmount: validation.predictiveAmount,
        customJsonPayload: [
          {
            contractName: 'hivepegged',
            contractAction: 'withdraw',
            contractPayload: {
              quantity: fixedEngineAmount(input.quantity, 3),
            },
          },
        ],
      };
    }

    const swapSymbol = AVAILABLE_TOKEN_WITHDRAW[input.outputSymbol];
    if (!swapSymbol || input.inputSymbol !== swapSymbol) {
      return unsupportedWithdrawPair();
    }

    const validation = await validateWithdrawOutputAmount({
      amount: input.quantity,
      outputSymbol: input.outputSymbol,
      fetchBtcMinimum: () => this.tribaldexClient.getBtcMinimumWithdrawal(),
    });
    if (!validation) {
      return {
        predictiveAmount: null,
        customJsonPayload: [],
        error: `invalid amount for ${input.outputSymbol}`,
      };
    }
    if (validation.error) {
      return quoteFromValidation(validation);
    }
    if (input.previewOnly) {
      return {
        predictiveAmount: validation.predictiveAmount,
        customJsonPayload: [],
      };
    }

    const withdrawResult = await this.buildWithdrawPayload({
      address: input.address,
      outputSymbol: input.outputSymbol,
      amount: input.quantity,
    });
    if ('error' in withdrawResult) {
      return {
        ...quoteFromValidation(validation),
        error: withdrawResult.error,
      };
    }

    return {
      predictiveAmount: validation.predictiveAmount,
      customJsonPayload: [withdrawResult.withdraw],
    };
  }

  private async quoteWaivWithdraw(input: {
    quantity: string;
    inputSymbol: string;
    outputSymbol: string;
    address: string;
    previewOnly: boolean;
  }): Promise<EngineWithdrawQuoteResult> {
    if (!AVAILABLE_TOKEN_WITHDRAW[input.outputSymbol]) {
      return { predictiveAmount: null, customJsonPayload: [], error: 'unsupported output' };
    }

    const tradeFeeMul = await this.resolveTradeFeeMul();
    const pools = await this.hiveEngine.findMarketPools({ limit: 1000 });
    const poolsByPair = buildPoolsByPair(pools);

    const swapData = this.buildSwapData({
      quantity: input.quantity,
      inputSymbol: input.inputSymbol,
      outputSymbol: input.outputSymbol,
      poolsByPair,
      tradeFeeMul,
    });
    if ('error' in swapData) {
      return { predictiveAmount: null, customJsonPayload: [], error: swapData.error };
    }

    const validation = await validateWithdrawOutputAmount({
      amount: swapData.amount,
      outputSymbol: input.outputSymbol,
      fetchBtcMinimum: () => this.tribaldexClient.getBtcMinimumWithdrawal(),
    });
    if (!validation) {
      return {
        predictiveAmount: null,
        customJsonPayload: [],
        error: `invalid amount for ${input.outputSymbol}`,
      };
    }
    if (validation.error) {
      return quoteFromValidation(validation);
    }
    if (input.previewOnly) {
      return {
        predictiveAmount: validation.predictiveAmount,
        customJsonPayload: [],
      };
    }

    const withdrawResult = await this.buildWithdrawPayload({
      address: input.address,
      outputSymbol: input.outputSymbol,
      amount: swapData.amount,
    });
    if ('error' in withdrawResult) {
      return {
        ...quoteFromValidation(validation),
        error: withdrawResult.error,
      };
    }

    const swapPayloads = swapData.swapJson.map((json) => this.parseCustomJson(json));
    return {
      predictiveAmount: validation.predictiveAmount,
      customJsonPayload: [...swapPayloads, withdrawResult.withdraw],
    };
  }
}
