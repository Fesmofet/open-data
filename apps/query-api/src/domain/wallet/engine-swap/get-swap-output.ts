import BigNumber from 'bignumber.js';

import type { HiveEngineMarketPool } from '@opden-data-layer/clients';

export type SwapPoolInput = Pick<
  HiveEngineMarketPool,
  | 'tokenPair'
  | 'baseQuantity'
  | 'quoteQuantity'
  | 'basePrice'
  | 'quotePrice'
  | 'precision'
>;

export type GetSwapOutputInput = {
  symbol: string;
  amountIn: string | number;
  pool: SwapPoolInput;
  slippage: number;
  from: boolean;
  tradeFeeMul: string | number;
  precision?: number;
};

export type GetSwapOutputResult = {
  fee: string;
  priceImpact: string;
  minAmountOut: string;
  amountOut: string;
  json: string;
};

function getUpdatedPoolStats({
  pool,
  baseAdjusted,
  quoteAdjusted,
}: {
  pool: SwapPoolInput;
  baseAdjusted: BigNumber;
  quoteAdjusted: BigNumber;
}): SwapPoolInput {
  const baseQuantity = new BigNumber(pool.baseQuantity)
    .plus(baseAdjusted)
    .toFixed(pool.precision, BigNumber.ROUND_HALF_UP);
  const quoteQuantity = new BigNumber(pool.quoteQuantity)
    .plus(quoteAdjusted)
    .toFixed(pool.precision, BigNumber.ROUND_HALF_UP);
  const basePrice = new BigNumber(quoteQuantity).dividedBy(baseQuantity).toFixed();
  const quotePrice = new BigNumber(baseQuantity).dividedBy(quoteQuantity).toFixed();
  return {
    ...pool,
    baseQuantity,
    quoteQuantity,
    basePrice,
    quotePrice,
  };
}

function getDiffPercent(before: string, after: string): string {
  if (new BigNumber(before).eq(0)) {
    return '0';
  }
  return new BigNumber(after).minus(before).div(before).times(100).toFixed();
}

function getAmountOut(
  tradeFeeMul: BigNumber,
  amountIn: BigNumber,
  liquidityIn: string,
  liquidityOut: string,
): BigNumber {
  const amountInWithFee = amountIn.times(tradeFeeMul);
  const num = amountInWithFee.times(liquidityOut);
  const den = new BigNumber(liquidityIn).plus(amountInWithFee);
  return num.dividedBy(den);
}

function calcFee({
  tradeFeeMul,
  tokenAmount,
  liquidityIn,
  liquidityOut,
  precision,
}: {
  tradeFeeMul: BigNumber;
  tokenAmount: BigNumber;
  liquidityIn: string;
  liquidityOut: string;
  precision: number;
}): string {
  const tokenAmountAdjusted = getAmountOut(
    tradeFeeMul,
    tokenAmount,
    liquidityIn,
    liquidityOut,
  );
  return BigNumber(tokenAmountAdjusted)
    .dividedBy(tradeFeeMul)
    .minus(tokenAmountAdjusted)
    .toFixed(precision, BigNumber.ROUND_HALF_UP);
}

function createSwapJson({
  tokenPair,
  minAmountOut,
  tokenSymbol,
  tokenAmount,
}: {
  tokenPair: string;
  minAmountOut: string;
  tokenSymbol: string;
  tokenAmount: string;
}): string {
  return JSON.stringify({
    contractName: 'marketpools',
    contractAction: 'swapTokens',
    contractPayload: {
      tokenPair,
      tokenSymbol,
      tokenAmount,
      tradeType: 'exactInput',
      minAmountOut,
    },
  });
}

/** Port of legacy `getSwapOutput` (swapTokenHelpers.js) — AMM math only, no withdraw validation. */
export function getSwapOutput(input: GetSwapOutputInput): GetSwapOutputResult | null {
  const { symbol, amountIn, pool, slippage, from, tradeFeeMul } = input;
  if (!pool?.tokenPair) {
    return null;
  }

  const precision = input.precision ?? pool.precision;
  const feeMul = new BigNumber(tradeFeeMul);
  const [baseSymbol, quoteSymbol] = pool.tokenPair.split(':');
  const isBase = symbol === baseSymbol;

  const tokenToExchange = isBase ? pool.baseQuantity : pool.quoteQuantity;
  const tokenExchangedOn = isBase ? pool.quoteQuantity : pool.baseQuantity;

  const absoluteValue = new BigNumber(tokenToExchange).times(tokenExchangedOn);
  const tokenToExchangeNewBalance = from
    ? new BigNumber(tokenToExchange).plus(amountIn)
    : new BigNumber(tokenToExchange).minus(amountIn);
  const tokenExchangedOnNewBalance = absoluteValue.div(tokenToExchangeNewBalance);
  const amountOut = new BigNumber(tokenExchangedOn)
    .minus(tokenExchangedOnNewBalance)
    .absoluteValue();

  const tokenPairDelta =
    symbol === baseSymbol
      ? [new BigNumber(amountIn), amountOut.negated()]
      : [amountOut.negated(), new BigNumber(amountIn)];

  const updatedPool = getUpdatedPoolStats({
    pool,
    baseAdjusted: tokenPairDelta[0],
    quoteAdjusted: tokenPairDelta[1],
  });

  const priceImpact = new BigNumber(getDiffPercent(pool.basePrice, updatedPool.basePrice))
    .abs()
    .toFixed(2);

  const tokenSymbol = from
    ? symbol
    : symbol === baseSymbol
      ? quoteSymbol
      : baseSymbol;

  const tradeDirection = tokenSymbol === baseSymbol;
  const liquidityIn = tradeDirection ? pool.baseQuantity : pool.quoteQuantity;
  const liquidityOut = tradeDirection ? pool.quoteQuantity : pool.baseQuantity;

  const tokenAmount = from
    ? new BigNumber(amountIn).toFixed(precision, BigNumber.ROUND_DOWN)
    : amountOut.toFixed(precision, BigNumber.ROUND_DOWN);

  const slippageAmount = from
    ? amountOut.times(slippage)
    : new BigNumber(amountIn).times(slippage);

  const fee = calcFee({
    tradeFeeMul: feeMul,
    tokenAmount: new BigNumber(tokenAmount),
    liquidityIn,
    liquidityOut,
    precision,
  });

  const minAmountOut = from
    ? amountOut.minus(slippageAmount)
    : new BigNumber(amountIn).minus(slippageAmount);

  let amountOutToFixed: string;
  if (from) {
    amountOutToFixed = amountOut.minus(fee).toFixed(precision, BigNumber.ROUND_DOWN);
  } else {
    const feeAmount = calcFee({
      tradeFeeMul: feeMul,
      tokenAmount: new BigNumber(amountIn),
      liquidityIn: tokenToExchangeNewBalance.toFixed(),
      liquidityOut: tokenExchangedOnNewBalance.toFixed(),
      precision,
    });
    const tradeFee = new BigNumber(feeAmount).times(0.02);
    const priceImpactFee = new BigNumber(priceImpact).div(100).times(feeAmount);
    amountOutToFixed = amountOut
      .minus(feeAmount)
      .plus(priceImpactFee)
      .minus(tradeFee)
      .toFixed(precision, BigNumber.ROUND_DOWN);
  }

  const minAmountOutToFixed = minAmountOut.minus(fee).toFixed(precision, BigNumber.ROUND_UP);
  const json = createSwapJson({
    minAmountOut: minAmountOutToFixed,
    tokenPair: pool.tokenPair,
    tokenSymbol,
    tokenAmount,
  });

  return {
    fee,
    priceImpact,
    minAmountOut: minAmountOutToFixed,
    amountOut: amountOutToFixed,
    json,
  };
}
