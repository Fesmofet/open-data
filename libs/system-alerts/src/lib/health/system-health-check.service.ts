import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  HiveClient,
  HiveEngineClient,
  RedisClientFactory,
} from '@opden-data-layer/clients';
import {
  type BlockCursorCheck,
  type CursorStatus,
  type SystemHealthReport,
  evaluateCursorLag,
} from './block-cursor-check';

export const SYSTEM_HEALTH_OPTIONS = Symbol('SYSTEM_HEALTH_OPTIONS');

export interface SystemHealthModuleOptions {
  readonly checks: readonly BlockCursorCheck[];
  readonly lagBuffer: number;
}

@Injectable()
export class SystemHealthCheckService {
  private readonly logger = new Logger(SystemHealthCheckService.name);

  constructor(
    @Inject(SYSTEM_HEALTH_OPTIONS)
    private readonly options: SystemHealthModuleOptions,
    private readonly redisFactory: RedisClientFactory,
    private readonly hiveClient: HiveClient,
    private readonly hiveEngineClient: HiveEngineClient,
  ) {}

  async check(): Promise<SystemHealthReport> {
    const checkedAt = new Date().toISOString();
    const ok: CursorStatus[] = [];
    const warnings: CursorStatus[] = [];

    const headHive = await this.resolveHiveHead();
    const headEngine = await this.resolveHiveEngineHead();

    for (const check of this.options.checks) {
      const status = await this.checkOne(
        check,
        check.chain === 'hive' ? headHive : headEngine,
      );
      if (status.ok) {
        ok.push(status);
      } else {
        warnings.push(status);
      }
    }

    return { checkedAt, ok, warnings };
  }

  private async checkOne(
    check: BlockCursorCheck,
    headBlock: number | null,
  ): Promise<CursorStatus> {
    if (headBlock === null) {
      this.logger.warn(`Head block unavailable for ${check.label}`);
      return {
        label: check.label,
        redisKey: check.redisKey,
        actualBlock: 0,
        headBlock: 0,
        lagBlocks: 0,
        ok: false,
        detail: 'Chain head block unavailable.',
      };
    }
    const raw = await this.redisFactory.getClient().get(check.redisKey);
    const actualBlock = raw !== null ? Number.parseInt(raw, 10) : Number.NaN;
    if (!Number.isFinite(actualBlock)) {
      this.logger.warn(`Invalid cursor at ${check.redisKey}`);
      return {
        label: check.label,
        redisKey: check.redisKey,
        actualBlock: 0,
        headBlock,
        lagBlocks: 0,
        ok: false,
        detail: 'Indexer cursor missing or invalid in Redis.',
      };
    }
    const { lagBlocks, ok } = evaluateCursorLag(
      actualBlock,
      headBlock,
      this.options.lagBuffer,
    );
    return {
      label: check.label,
      redisKey: check.redisKey,
      actualBlock,
      headBlock,
      lagBlocks,
      ok,
    };
  }

  private async resolveHiveHead(): Promise<number | null> {
    const props = await this.hiveClient.getDynamicGlobalProperties();
    const head = props?.head_block_number;
    return typeof head === 'number' && Number.isFinite(head) ? head : null;
  }

  private async resolveHiveEngineHead(): Promise<number | null> {
    const status = await this.hiveEngineClient.getStatus();
    const head = status?.lastBlockNumber;
    return typeof head === 'number' && Number.isFinite(head) ? head : null;
  }
}
