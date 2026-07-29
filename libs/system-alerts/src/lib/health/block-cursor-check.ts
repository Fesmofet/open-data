import { buildRedisKey } from '@opden-data-layer/core';
import type { SystemAlert } from '../contract/system-alert';

export type BlockCursorChain = 'hive' | 'hive-engine';

export interface BlockCursorCheck {
  readonly label: string;
  readonly redisKey: string;
  readonly chain: BlockCursorChain;
}

const CHAIN_INDEXER = 'chain-indexer';

export const DEFAULT_BLOCK_CURSOR_CHECKS: readonly BlockCursorCheck[] = [
  {
    label: 'chain-indexer hive',
    redisKey: buildRedisKey(CHAIN_INDEXER, 'cache', 'hive', 'block-number'),
    chain: 'hive',
  },
  {
    label: 'chain-indexer hive-engine',
    redisKey: buildRedisKey(
      CHAIN_INDEXER,
      'cache',
      'hive-engine',
      'block-number',
    ),
    chain: 'hive-engine',
  },
] as const;

export const DEFAULT_BLOCK_LAG_BUFFER = 100;

export interface CursorStatus {
  readonly label: string;
  readonly redisKey: string;
  readonly actualBlock: number;
  readonly headBlock: number;
  readonly lagBlocks: number;
  readonly ok: boolean;
  /** Set when head or cursor could not be read (probe failure). */
  readonly detail?: string;
}

export interface SystemHealthReport {
  readonly checkedAt: string;
  readonly ok: readonly CursorStatus[];
  readonly warnings: readonly CursorStatus[];
}

export function evaluateCursorLag(
  actualBlock: number,
  headBlock: number,
  lagBuffer: number,
): { lagBlocks: number; ok: boolean } {
  const lagBlocks = Math.max(0, headBlock - actualBlock);
  const ok = actualBlock + lagBuffer >= headBlock;
  return { lagBlocks, ok };
}

export function formatCursorStatusLine(status: CursorStatus): string {
  if (status.detail) {
    return `Warning on ${status.label} with key: ${status.redisKey}.\n ${status.detail}`;
  }
  const prefix = status.ok ? 'Success' : 'Warning';
  return `${prefix} on ${status.label} with key: ${status.redisKey}.\n Delay for ${status.lagBlocks} block(s).`;
}

export function renderSystemHealthReport(report: SystemHealthReport): string {
  const parts: string[] = [];
  if (report.ok.length > 0) {
    parts.push(
      'SUCCESS MESSAGES',
      ...report.ok.map((s) => formatCursorStatusLine(s)),
    );
  }
  if (report.warnings.length > 0) {
    parts.push(
      'WARNING MESSAGES',
      ...report.warnings.map((s) => formatCursorStatusLine(s)),
    );
  }
  if (parts.length === 0) {
    return 'No cursor checks configured.';
  }
  return parts.join('\n\n');
}

export function systemHealthReportToAlert(
  report: SystemHealthReport,
  source: string,
): SystemAlert | null {
  if (report.warnings.length === 0) {
    return null;
  }
  return {
    source,
    severity: 'warn',
    title: 'System health warnings',
    lines: report.warnings.map((s) => formatCursorStatusLine(s)),
    occurredAt: report.checkedAt,
  };
}
