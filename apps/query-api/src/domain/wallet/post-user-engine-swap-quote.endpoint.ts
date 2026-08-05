import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  HiveEngineClient,
  HiveEngineUnavailableError,
} from '@opden-data-layer/clients';
import { isEngineDisabledPeggedSwapSymbol } from '@opden-data-layer/core/hive-engine-history';

import { AccountsCurrentRepository } from '../../repositories';
import {
  DEFAULT_SWAP_SLIPPAGE,
  DEFAULT_TRADE_FEE_MUL,
  SWAP_IMPACT_PERCENT_OPTIONS,
} from './engine-swap/engine-swap.constants';
import {
  buildDoubleSwapToWaivHops,
  buildPoolsByPair,
  executeSwapSequence,
  isDoubleSwapToWaiv,
} from './engine-swap/execute-swap-sequence';
import { findSwapPair } from './engine-swap/build-swap-list';
import { getSwapOutput } from './engine-swap/get-swap-output';
import { buildSwapListTokens } from './engine-swap/build-swap-list';
import type {
  EngineSwapQuoteBody,
  EngineSwapQuoteResponse,
} from './schemas/engine-swap.schema';

@Injectable()
export class PostUserEngineSwapQuoteEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveEngine: HiveEngineClient,
  ) {}

  async execute(
    profileAccountName: string,
    body: EngineSwapQuoteBody,
  ): Promise<EngineSwapQuoteResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const slippage = body.slippage ?? DEFAULT_SWAP_SLIPPAGE;
    const fromSymbol = body.fromSymbol.trim().toUpperCase();
    const toSymbol = body.toSymbol.trim().toUpperCase();

    if (
      isEngineDisabledPeggedSwapSymbol(fromSymbol) ||
      isEngineDisabledPeggedSwapSymbol(toSymbol)
    ) {
      throw new BadRequestException('swap pair unavailable');
    }

    try {
      const [pools, params, balances] = await Promise.all([
        this.hiveEngine.findMarketPools({ limit: 1000 }),
        this.hiveEngine.findOneMarketPoolParam(),
        this.hiveEngine.findTokenBalances({
          query: { account: profileAccountName },
          limit: 1000,
        }),
      ]);

      const tradeFeeMul = params?.tradeFeeMul ?? DEFAULT_TRADE_FEE_MUL;
      const poolsByPair = buildPoolsByPair(pools);
      const tokenRows =
        balances.length > 0
          ? await this.hiveEngine.findTokens({
              query: {
                symbol: {
                  $in: [...new Set(balances.map((row) => row.symbol))],
                },
              },
              limit: balances.length,
            })
          : [];

      const tokenMetadata = new Map(
        tokenRows.map((token) => [
          token.symbol,
          { name: token.name, precision: token.precision, metadata: token.metadata },
        ]),
      );

      const swapList = buildSwapListTokens({ pools, balances, tokenMetadata });

      if (isDoubleSwapToWaiv(fromSymbol, toSymbol)) {
        const hops = buildDoubleSwapToWaivHops(fromSymbol, toSymbol);
        if (!hops) {
          throw new BadRequestException('invalid double swap route');
        }
        const sequence = executeSwapSequence({
          hops,
          amountIn: body.amountIn,
          poolsByPair,
          tradeFeeMul,
          slippageFirst: slippage,
          slippageRest: slippage,
        });
        if ('error' in sequence) {
          throw new BadRequestException(sequence.error);
        }
        const customJson = sequence.swapJson.map(
          (json) => JSON.parse(json) as Record<string, unknown>,
        );
        return {
          amountOut: sequence.amountOut,
          minAmountOut: sequence.minAmountOut,
          priceImpact: sequence.priceImpact,
          feePercentOptions: [...SWAP_IMPACT_PERCENT_OPTIONS],
          customJson,
        };
      }

      const pair = findSwapPair(swapList, fromSymbol, toSymbol);
      if (!pair) {
        throw new BadRequestException('swap pair unavailable');
      }

      const pool = poolsByPair.get(pair.tokenPair);
      if (!pool) {
        throw new BadRequestException('market pool unavailable');
      }

      const fromToken = swapList.find((token) => token.symbol === fromSymbol);
      const toToken = swapList.find((token) => token.symbol === toSymbol);
      const fromPrecision = fromToken?.precision ?? pool.precision;
      const toPrecision = toToken?.precision ?? pool.precision;

      if (body.direction === 'exactInput') {
        const result = getSwapOutput({
          symbol: fromSymbol,
          amountIn: body.amountIn,
          pool,
          slippage,
          from: true,
          tradeFeeMul,
          precision: toPrecision,
        });
        if (!result) {
          throw new BadRequestException('swap calculation failed');
        }
        return {
          amountOut: result.amountOut,
          minAmountOut: result.minAmountOut,
          priceImpact: result.priceImpact,
          feePercentOptions: [...SWAP_IMPACT_PERCENT_OPTIONS],
          customJson: [JSON.parse(result.json) as Record<string, unknown>],
        };
      }

      const reverseResult = getSwapOutput({
        symbol: toSymbol,
        amountIn: body.amountIn,
        pool,
        slippage,
        from: false,
        tradeFeeMul,
        precision: fromPrecision,
      });
      if (!reverseResult) {
        throw new BadRequestException('swap calculation failed');
      }

      return {
        amountOut: reverseResult.amountOut,
        minAmountOut: reverseResult.minAmountOut,
        priceImpact: reverseResult.priceImpact,
        feePercentOptions: [...SWAP_IMPACT_PERCENT_OPTIONS],
        customJson: [JSON.parse(reverseResult.json) as Record<string, unknown>],
      };
    } catch (e) {
      if (e instanceof HiveEngineUnavailableError) {
        throw new ServiceUnavailableException('Hive Engine unavailable');
      }
      throw e;
    }
  }
}
