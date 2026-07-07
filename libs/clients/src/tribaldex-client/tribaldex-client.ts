import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  TRIBALDEX_CLIENT_MODULE_OPTIONS,
  type TribaldexClientModuleOptions,
} from './tribaldex-client.options';
import type { TribaldexClientInterface } from './interface/tribaldex-client.interface';
import type { TribaldexSettingsResponse } from './type';

const DEFAULT_BASE = 'https://api.tribaldex.com';
const DEFAULT_TIMEOUT_MS = 12_000;

@Injectable()
export class TribaldexClient implements TribaldexClientInterface {
  private readonly logger = new Logger(TribaldexClient.name);

  constructor(
    @Inject(TRIBALDEX_CLIENT_MODULE_OPTIONS)
    private readonly options: TribaldexClientModuleOptions,
  ) {}

  private baseUrl(): string {
    return (this.options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
  }

  private timeoutMs(): number {
    return this.options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async getSettings(): Promise<TribaldexSettingsResponse | undefined> {
    const url = `${this.baseUrl()}/settings`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        this.logger.warn(`Tribaldex settings HTTP ${response.status}`);
        return undefined;
      }
      return (await response.json()) as TribaldexSettingsResponse;
    } catch (e) {
      this.logger.error((e as Error).message);
      return undefined;
    }
  }

  async getBtcMinimumWithdrawal(): Promise<number | null> {
    const settings = await this.getSettings();
    const rows = settings?.minimum_withdrawals;
    if (!rows) {
      return null;
    }
    const row = rows.find((entry) => entry[0] === 'SWAP.BTC');
    return row?.[1] ?? null;
  }
}
