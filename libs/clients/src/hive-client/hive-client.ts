import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetVoteInterface, HiveClientInterface } from './interface';
import {
  ActiveVotesType,
  CommentStateType,
  HiveAccountType,
  HiveContentType,
  HiveCurrentMedianHistoryPrice,
  HiveFollowRelation,
} from './type';
import type {
  HiveAccountHistoryPage,
  HiveAccountHistoryRow,
  HiveDynamicGlobalProperties,
  HiveOperationFilter,
} from './type';
import { CommentOptionsOperation } from '@hiveio/dhive/lib/chain/operation';
import { BeneficiaryRoute } from '@hiveio/dhive/lib/chain/comment';
import { SignedBlock } from '@hiveio/dhive/lib/chain/block';
import { CONDENSER_API, BRIDGE, HIVE_ACCOUNT_HISTORY_ATTEMPTS, HIVE_ACCOUNT_HISTORY_MAX_LIMIT } from './constants';
import { parseHiveAccountHistoryAssertContinueFrom } from './parse-hive-account-history-assert';
import { UrlRotationManager, UrlRotationService } from '../redis-client';
import { HIVE_CLIENT_MODULE_OPTIONS } from './hive-client.options';
import type { HiveClientModuleOptions } from './hive-client.options';

@Injectable()
export class HiveClient implements HiveClientInterface {
  private readonly logger = new Logger(HiveClient.name);
  private readonly urlRotationManager: UrlRotationManager;

  constructor(
    @Inject(HIVE_CLIENT_MODULE_OPTIONS)
    private readonly options: HiveClientModuleOptions,
    private readonly urlRotationService: UrlRotationService,
  ) {
    this.urlRotationManager = this.urlRotationService.getManager({
      nodes: this.options.nodes,
      cachePrefix: this.options.cachePrefix ?? 'hive_client_url_rotation',
      cacheTtlSeconds: this.options.cacheTtlSeconds ?? 1200,
      maxResponseTimeMs: this.options.maxResponseTimeMs ?? 8000,
      db: this.options.urlRotationDb ?? 0,
    });
  }

  private async pickNode(): Promise<string> {
    try {
      return await this.urlRotationManager.getBestUrl();
    } catch (error) {
      this.logger.warn(
        `Falling back to default node: ${
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

  private async hiveRequest<T>(
    method: string,
    params: unknown,
  ): Promise<T | undefined> {
    const url = await this.pickNode();
    const start = Date.now();
    let hasError = false;
    const controller = new AbortController();
    const timeoutMs = this.options.maxResponseTimeMs ?? 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
        signal: controller.signal,
      });

      const bodyText = await resp.text();
      if (!bodyText.trim()) {
        hasError = true;
        return undefined;
      }

      let data: { result?: T; error?: unknown };
      try {
        data = JSON.parse(bodyText) as { result?: T; error?: unknown };
      } catch (error) {
        this.logger.error(
          `Invalid JSON from ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        hasError = true;
        return undefined;
      }

      hasError = !resp.ok || Boolean(data?.error);
      return data?.result;
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      hasError = true;
      return undefined;
    } finally {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;
      await this.recordRequest(url, responseTime, hasError);
    }
  }

  async getBlock(blockNumber: number): Promise<SignedBlock | undefined> {
    return this.hiveRequest(CONDENSER_API.GET_BLOCK, [blockNumber]);
  }

  getOptionsWithBeneficiaries(
    author: string,
    permlink: string,
    beneficiaries: BeneficiaryRoute[],
  ): CommentOptionsOperation[1] {
    return {
      extensions: [[0, { beneficiaries }]],
      author,
      permlink,
      max_accepted_payout: '100000.000 HBD',
      percent_hbd: 0,
      allow_votes: true,
      allow_curation_rewards: true,
    };
  }

  async getContent(
    author: string,
    permlink: string,
  ): Promise<HiveContentType | undefined> {
    return this.hiveRequest<HiveContentType>(CONDENSER_API.GET_CONTENT, [
      author,
      permlink,
    ]);
  }

  async getDiscussionsByComments(params: {
    start_author: string;
    start_permlink?: string;
    limit: number;
  }): Promise<HiveContentType[]> {
    // Hive account names are lowercase on-chain; condenser_api returns [] for mixed-case start_author.
    const startAuthor = params.start_author.trim().toLowerCase();
    if (startAuthor === '') {
      return [];
    }
    const rawLimit = Number(params.limit);
    const limit =
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(20, Math.floor(rawLimit))
        : 1;
    const payload: {
      start_author: string;
      limit: number;
      start_permlink?: string;
    } = {
      start_author: startAuthor,
      limit,
    };
    const anchor = params.start_permlink?.trim();
    if (anchor) {
      payload.start_permlink = anchor;
    }
    return (
      (await this.hiveRequest<HiveContentType[]>(
        CONDENSER_API.GET_DISCUSSIONS_BY_COMMENTS,
        [payload],
      )) ?? []
    );
  }

  async getState(author: string, permlink: string): Promise<CommentStateType> {
    const content = await this.hiveRequest<Record<string, HiveContentType>>(
      BRIDGE.GET_DISCUSSION,
      { author, permlink },
    );

    if (content) {
      for (const contentKey in content) {
        if (content[contentKey]?.json_metadata) {
          content[contentKey].json_metadata = JSON.stringify(
            content[contentKey].json_metadata,
          );
        }
      }
    }

    return { content: content ?? {} };
  }

  async getActiveVotes(
    author: string,
    permlink: string,
  ): Promise<ActiveVotesType[]> {
    return (
      (await this.hiveRequest<ActiveVotesType[]>(
        CONDENSER_API.GET_ACTIVE_VOTES,
        [author, permlink],
      )) ?? []
    );
  }

  async getVote({
    author,
    voter,
    permlink,
  }: GetVoteInterface): Promise<ActiveVotesType | undefined> {
    const activeVotes = await this.getActiveVotes(author, permlink);
    return activeVotes?.find((v) => v.voter === voter);
  }

  async getAccounts(names: string[]): Promise<HiveAccountType[]> {
    if (names.length === 0) {
      return [];
    }
    return (
      (await this.hiveRequest<HiveAccountType[]>(CONDENSER_API.GET_ACCOUNTS, [
        names,
      ])) ?? []
    );
  }

  async getFollowers(
    account: string,
    startFollower: string | null,
    type: 'blog',
    limit: number,
  ): Promise<HiveFollowRelation[]> {
    return (
      (await this.hiveRequest<HiveFollowRelation[]>(
        CONDENSER_API.GET_FOLLOWERS,
        [account, startFollower, type, limit],
      )) ?? []
    );
  }

  async getFollowing(
    account: string,
    startFollowing: string | null,
    type: 'blog',
    limit: number,
  ): Promise<HiveFollowRelation[]> {
    return (
      (await this.hiveRequest<HiveFollowRelation[]>(
        CONDENSER_API.GET_FOLLOWING,
        [account, startFollowing, type, limit],
      )) ?? []
    );
  }

  async getCurrentMedianHistoryPrice(): Promise<
    HiveCurrentMedianHistoryPrice | undefined
  > {
    return this.hiveRequest<HiveCurrentMedianHistoryPrice>(
      CONDENSER_API.GET_CURRENT_MEDIAN_HISTORY_PRICE,
      [],
    );
  }

  async getMutedList(observer: string) {
    return (
      (await this.hiveRequest<{ name: string }[]>(BRIDGE.GET_FOLLOW_LIST, {
        observer,
        follow_type: 'muted',
      })) ?? []
    );
  }

  async getAccountHistory(
    account: string,
    from: number,
    limit: number,
    operationFilter?: HiveOperationFilter,
  ): Promise<HiveAccountHistoryPage | null> {
    const normalizedAccount = account.trim().toLowerCase();
    if (normalizedAccount === '') {
      return { rows: [] };
    }
    const rawLimit = Number(limit);
    const clampedLimit =
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(HIVE_ACCOUNT_HISTORY_MAX_LIMIT, Math.floor(rawLimit))
        : 20;
    const startIndex = Number.isFinite(from) ? Math.floor(from) : -1;
    const params: (string | number)[] = [
      normalizedAccount,
      startIndex,
      clampedLimit,
    ];
    if (operationFilter) {
      params.push(operationFilter.filterLow, operationFilter.filterHigh);
    }
    for (let attempt = 0; attempt < HIVE_ACCOUNT_HISTORY_ATTEMPTS; attempt++) {
      const page = await this.fetchAccountHistoryPage(params);
      if (page !== undefined) {
        return page;
      }
    }
    return null;
  }

  private async fetchAccountHistoryPage(
    params: (string | number)[],
  ): Promise<HiveAccountHistoryPage | undefined> {
    const url = await this.pickNode();
    const start = Date.now();
    let hasError = false;
    const controller = new AbortController();
    const timeoutMs = this.options.maxResponseTimeMs ?? 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: CONDENSER_API.GET_ACCOUNT_HISTORY,
          params,
          id: 1,
        }),
        signal: controller.signal,
      });

      const bodyText = await resp.text();
      if (!bodyText.trim()) {
        hasError = true;
        return undefined;
      }

      let data: {
        result?: HiveAccountHistoryRow[];
        error?: unknown;
      };
      try {
        data = JSON.parse(bodyText) as {
          result?: HiveAccountHistoryRow[];
          error?: unknown;
        };
      } catch (error) {
        this.logger.error(
          `Invalid JSON from ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        hasError = true;
        return undefined;
      }

      if (data.error) {
        const continueFrom = parseHiveAccountHistoryAssertContinueFrom(data.error);
        if (continueFrom !== undefined) {
          return { rows: [], continueFrom };
        }
        hasError = true;
        return undefined;
      }

      if (!resp.ok) {
        hasError = true;
        return undefined;
      }

      return { rows: data.result ?? [] };
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      hasError = true;
      return undefined;
    } finally {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;
      await this.recordRequest(url, responseTime, hasError);
    }
  }

  async getDynamicGlobalProperties(): Promise<
    HiveDynamicGlobalProperties | undefined
  > {
    return this.hiveRequest<HiveDynamicGlobalProperties>(
      CONDENSER_API.GET_DYNAMIC_GLOBAL_PROPERTIES,
      [],
    );
  }
}
