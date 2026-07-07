import type {
  HiveEngineConvertRequest,
  HiveEngineConvertResponse,
  HiveEngineConverterCoin,
  HiveEngineConverterPair,
} from '../type';

export interface HiveEngineConvertClientInterface {
  convert(input: HiveEngineConvertRequest): Promise<HiveEngineConvertResponse | null>;
  listPairs(): Promise<HiveEngineConverterPair[] | null>;
  listCoins(): Promise<HiveEngineConverterCoin[] | null>;
}
