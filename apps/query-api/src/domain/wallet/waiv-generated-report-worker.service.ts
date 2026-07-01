import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { randomUUID } from 'node:crypto';

import { redisKey } from '../../constants/redis-keys';
import {
  WAIV_GENERATED_REPORT_LOCK_TTL_SEC,
  WAIV_GENERATED_REPORT_WORKER_INTERVAL_MS,
} from '../../constants/waiv-generated-report.constants';
import { WaivGeneratedReportsRepository } from '../../repositories/waiv-generated-reports.repository';
import { WaivGeneratedReportsService } from './waiv-generated-reports.service';

@Injectable()
export class WaivGeneratedReportWorkerService {
  private readonly logger = new Logger(WaivGeneratedReportWorkerService.name);

  constructor(
    private readonly reportsRepo: WaivGeneratedReportsRepository,
    private readonly reportsService: WaivGeneratedReportsService,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  @Interval(WAIV_GENERATED_REPORT_WORKER_INTERVAL_MS)
  async tick(): Promise<void> {
    const report = await this.reportsRepo.findNextRunnableReport();
    if (!report) {
      return;
    }

    const lockKey = redisKey.waivGeneratedReportLock(report.id);
    const token = randomUUID();
    const redis = this.redisFactory.getClient(0);
    let acquired = false;
    try {
      acquired = await redis.trySetNx(lockKey, token, WAIV_GENERATED_REPORT_LOCK_TTL_SEC);
    } catch (e) {
      this.logger.error((e as Error).message);
      return;
    }
    if (!acquired) {
      return;
    }

    try {
      await this.reportsService.processNextBatch(report.id);
    } catch (e) {
      this.logger.error((e as Error).message);
    } finally {
      try {
        await redis.releaseLockIfValue(lockKey, token);
      } catch (e) {
        this.logger.error((e as Error).message);
      }
    }
  }
}
