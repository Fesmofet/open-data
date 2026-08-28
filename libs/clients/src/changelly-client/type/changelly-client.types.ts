export type ChangellyJsonRpcRequest = {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: Record<string, unknown>;
};

export type ChangellyPairParams = {
  from: string;
  to: string;
  minAmountFloat: string;
  maxAmountFloat: string;
};

export type ChangellyExchangeAmount = {
  from: string;
  to: string;
  amountFrom: string;
  amountTo: string;
};

export type ChangellyTransactionResult = {
  id: string;
  payinAddress: string;
  payinExtraId: string;
  amountExpectedFrom: string;
  amountExpectedTo: string;
  trackUrl: string;
};

export type ChangellyPayinExchange = {
  memo: string;
  receiver: string;
  exchangeId: string;
  outputAmount: string;
  trackUrl: string;
};
