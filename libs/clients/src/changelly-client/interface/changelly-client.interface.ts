import type {
  ChangellyExchangeAmount,
  ChangellyPairParams,
  ChangellyPayinExchange,
} from '../type';

export type ChangellyClientResult<T> =
  | { result: T; error?: undefined }
  | { result?: undefined; error: { message: string } };

export interface ChangellyClientInterface {
  getPairsParams(input: {
    from?: string;
    to: string;
  }): Promise<ChangellyClientResult<ChangellyPairParams>>;

  getExchangeAmount(input: {
    from?: string;
    to: string;
    amountFrom: number;
  }): Promise<ChangellyClientResult<ChangellyExchangeAmount>>;

  createTransaction(input: {
    from?: string;
    to: string;
    amountFrom: number;
    address: string;
    refundAddress: string;
  }): Promise<ChangellyClientResult<ChangellyPayinExchange>>;
}
