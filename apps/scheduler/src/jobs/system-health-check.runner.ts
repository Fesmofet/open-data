import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  systemHealthReportToAlert,
  SystemAlertPublisherService,
  SystemHealthCheckService,
} from '@opden-data-layer/system-alerts';
import type { JobHandlerContext } from './cron-job.types';

let runnerRef: SystemHealthCheckRunner | null = null;

function registerSystemHealthCheckRunner(r: SystemHealthCheckRunner): void {
  runnerRef = r;
}

export function getSystemHealthCheckRunner(): SystemHealthCheckRunner {
  if (!runnerRef) {
    throw new Error('SystemHealthCheckRunner is not registered yet');
  }
  return runnerRef;
}

@Injectable()
export class SystemHealthCheckRunner implements OnModuleInit {
  private readonly logger = new Logger(SystemHealthCheckRunner.name);

  constructor(
    private readonly health: SystemHealthCheckService,
    private readonly publisher: SystemAlertPublisherService,
  ) {}

  onModuleInit(): void {
    registerSystemHealthCheckRunner(this);
  }

  async run(ctx: JobHandlerContext): Promise<void> {
    if (ctx.signal.aborted) {
      return;
    }
    const report = await this.health.check();
    if (report.warnings.length === 0) {
      this.logger.debug(
        `system-health-check: ok (${report.ok.length} cursor(s))`,
      );
      return;
    }
    const alert = systemHealthReportToAlert(report, 'scheduler');
    if (!alert) {
      return;
    }
    if (ctx.signal.aborted) {
      return;
    }
    await this.publisher.publish(alert);
    this.logger.log(
      `system-health-check: published alert (${report.warnings.length} warning(s))`,
    );
  }
}
