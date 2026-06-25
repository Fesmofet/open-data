import { Inject, Injectable, Logger } from '@nestjs/common';
import { UrlRotationManager, UrlRotationService } from '../redis-client';
import { ACCOUNT_HISTORY_PATH } from './constants';
import { HIVE_ENGINE_HISTORY_CLIENT_MODULE_OPTIONS } from './hive-engine-history-client.options';
import type { HiveEngineHistoryClientModuleOptions } from './hive-engine-history-client.options';
import type { HiveEngineHistoryClientInterface, HiveEngineAccountHistoryResult } from './interface';
import type {
  HiveEngineAccountHistoryEntry,
  HiveEngineAccountHistoryParams,
} from './type';

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

@Injectable()
export class HiveEngineHistoryClient implements HiveEngineHistoryClientInterface {
  private readonly logger = new Logger(HiveEngineHistoryClient.name);
  private readonly urlRotationManager: UrlRotationManager;

  constructor(
    @Inject(HIVE_ENGINE_HISTORY_CLIENT_MODULE_OPTIONS)
    private readonly options: HiveEngineHistoryClientModuleOptions,
    private readonly urlRotationService: UrlRotationService,
  ) {
    this.urlRotationManager = this.urlRotationService.getManager({
      nodes: this.options.nodes,
      cachePrefix:
        this.options.cachePrefix ?? 'hive_engine_history_client_url_rotation',
      cacheTtlSeconds: this.options.cacheTtlSeconds ?? 1200,
      maxResponseTimeMs: this.options.maxResponseTimeMs ?? 8000,
      db: this.options.urlRotationDb ?? 0,
    });
  }

  private requestTimeoutMs(): number {
    return this.options.maxResponseTimeMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  private async pickNode(): Promise<string> {
    try {
      return await this.urlRotationManager.getBestUrl();
    } catch (error) {
      this.logger.warn(
        `Falling back to default history node: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.options.nodes[0];
    }
  }

  private async recordRequest(
    url: string,
    responseTime: number,
    hasError: boolean,
  ): Promise<void> {
    await this.urlRotationManager.recordRequest(url, responseTime, hasError);
  }

  private normalizeNodeBase(node: string): string {
    return node.replace(/\/+$/, '');
  }

  private buildAccountHistoryUrl(
    node: string,
    params: HiveEngineAccountHistoryParams,
  ): string {
    const base = this.normalizeNodeBase(node);
    const url = new URL(`${base}/${ACCOUNT_HISTORY_PATH}`);
    url.searchParams.set('account', params.account);
    if (params.symbol !== undefined) {
      url.searchParams.set('symbol', params.symbol);
    }
    if (params.ops !== undefined) {
      url.searchParams.set('ops', params.ops);
    }
    if (params.timestampStart !== undefined) {
      url.searchParams.set('timestampStart', String(params.timestampStart));
    }
    if (params.timestampEnd !== undefined) {
      url.searchParams.set('timestampEnd', String(params.timestampEnd));
    }
    if (params.limit !== undefined) {
      url.searchParams.set('limit', String(params.limit));
    }
    if (params.offset !== undefined) {
      url.searchParams.set('offset', String(params.offset));
    }
    return url.toString();
  }

  async accountHistory(
    params: HiveEngineAccountHistoryParams,
  ): Promise<HiveEngineAccountHistoryEntry[]> {
    const result = await this.accountHistoryWithStatus(params);
    return result.entries;
  }

  async accountHistoryWithStatus(
    params: HiveEngineAccountHistoryParams,
  ): Promise<HiveEngineAccountHistoryResult> {
    const node = await this.pickNode();
    const requestUrl = this.buildAccountHistoryUrl(node, params);
    const start = Date.now();
    let hasError = false;
    const controller = new AbortController();
    const timeoutMs = this.requestTimeoutMs();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(requestUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!resp.ok) {
        hasError = true;
        this.logger.warn(
          `accountHistory HTTP ${resp.status} from ${this.normalizeNodeBase(node)}`,
        );
        return { entries: [], unavailable: true };
      }

      const data = (await resp.json()) as
        | HiveEngineAccountHistoryEntry[]
        | { result?: HiveEngineAccountHistoryEntry[]; error?: unknown };

      if (Array.isArray(data)) {
        return { entries: data, unavailable: false };
      }
      if (data?.error) {
        hasError = true;
        return { entries: [], unavailable: true };
      }
      return { entries: data?.result ?? [], unavailable: false };
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      hasError = true;
      return { entries: [], unavailable: true };
    } finally {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;
      await this.recordRequest(node, responseTime, hasError);
    }
  }
}
