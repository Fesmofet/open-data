import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  HIVE_ENGINE_CONVERT_CLIENT_MODULE_OPTIONS,
  type HiveEngineConvertClientModuleOptions,
} from './hive-engine-convert-client.options';
import type { HiveEngineConvertClientInterface } from './interface/hive-engine-convert-client.interface';
import type {
  HiveEngineConvertRequest,
  HiveEngineConvertResponse,
  HiveEngineConverterCoin,
  HiveEngineConverterPair,
} from './type';

const DEFAULT_BASE = 'https://converter-api.hive-engine.com/api/convert/';
const DEFAULT_TIMEOUT_MS = 12_000;

@Injectable()
export class HiveEngineConvertClient implements HiveEngineConvertClientInterface {
  private readonly logger = new Logger(HiveEngineConvertClient.name);

  constructor(
    @Inject(HIVE_ENGINE_CONVERT_CLIENT_MODULE_OPTIONS)
    private readonly options: HiveEngineConvertClientModuleOptions,
  ) {}

  /** converter-api requires a trailing slash on `/api/convert/`. */
  private convertUrl(): string {
    const raw = this.options.baseUrl ?? DEFAULT_BASE;
    const withoutTrailing = raw.replace(/\/+$/, '');
    return `${withoutTrailing}/`;
  }

  private apiRootUrl(): string {
    return this.convertUrl().replace(/convert\/$/, '');
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        this.logger.warn(`Hive Engine converter HTTP ${response.status} for ${url}`);
        return null;
      }
      return (await response.json()) as T;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async listPairs(): Promise<HiveEngineConverterPair[] | null> {
    return this.fetchJson<HiveEngineConverterPair[]>(`${this.apiRootUrl()}pairs/`);
  }

  async listCoins(): Promise<HiveEngineConverterCoin[] | null> {
    return this.fetchJson<HiveEngineConverterCoin[]>(`${this.apiRootUrl()}coins/`);
  }

  private timeoutMs(): number {
    return this.options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private async readErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as {
        message?: string;
        detail?: string;
        error?: boolean;
      };
      if (typeof body.message === 'string' && body.message.length > 0) {
        return body.message;
      }
      if (typeof body.detail === 'string' && body.detail.length > 0) {
        return body.detail;
      }
    } catch {
      // ignore parse errors
    }
    return `convert HTTP ${response.status}`;
  }

  async convert(
    input: HiveEngineConvertRequest,
  ): Promise<HiveEngineConvertResponse | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
      const response = await fetch(this.convertUrl(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const message = await this.readErrorMessage(response);
        this.logger.warn(`Hive Engine convert HTTP ${response.status}: ${message}`);
        return { error: message };
      }
      return (await response.json()) as HiveEngineConvertResponse;
    } catch (e) {
      this.logger.error((e as Error).message);
      return { error: (e as Error).message };
    }
  }
}
