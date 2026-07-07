import type { TribaldexSettingsResponse } from '../type';

export interface TribaldexClientInterface {
  getSettings(): Promise<TribaldexSettingsResponse | undefined>;
  getBtcMinimumWithdrawal(): Promise<number | null>;
}
