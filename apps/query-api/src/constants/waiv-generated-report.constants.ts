import {
  WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE,
  WAIV_GENERATED_REPORT_WORKER_BATCH_SIZE,
} from '@opden-data-layer/core/waiv-advanced-report';

export const WAIV_GENERATED_REPORT_MAX_CONCURRENT = 12;

export const WAIV_GENERATED_REPORT_WORKER_INTERVAL_MS = 3_000;

export const WAIV_GENERATED_REPORT_LOCK_TTL_SEC = 60;

export const WAIV_GENERATED_REPORT_PAGE_SIZE = WAIV_GENERATED_REPORT_WORKER_BATCH_SIZE;

export const WAIV_GENERATED_REPORT_LIST_DEFAULT_LIMIT = 20;

export const WAIV_GENERATED_REPORT_ROWS_DEFAULT_LIMIT =
  WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE;

export const WAIV_GENERATED_REPORT_STATUS = {
  pending: 'pending',
  inProgress: 'in_progress',
  completed: 'completed',
  failed: 'failed',
  stopped: 'stopped',
} as const;
