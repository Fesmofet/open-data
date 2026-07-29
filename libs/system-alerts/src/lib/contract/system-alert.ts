import { z } from 'zod';
import { buildRedisKey } from '@opden-data-layer/core';

export type SystemAlertSeverity = 'warn' | 'error' | 'info';

export interface SystemAlert {
  readonly source: string;
  readonly severity: SystemAlertSeverity;
  readonly title: string;
  readonly lines: readonly string[];
  readonly occurredAt: string;
}

export const SYSTEM_ALERT_STREAM_KEY = buildRedisKey(
  'notifications',
  'queue',
  'system-alerts',
);

export const SYSTEM_ALERT_CONSUMER_GROUP = 'system-alerts-ops';

export const SYSTEM_ALERT_STREAM_DATA_FIELD = 'payload';

export const systemAlertSchema = z.object({
  source: z.string().min(1),
  severity: z.enum(['warn', 'error', 'info']),
  title: z.string().min(1),
  lines: z.array(z.string()),
  occurredAt: z.string().min(1),
});

export function renderSystemAlertText(alert: SystemAlert): string {
  const body = alert.lines.join('\n');
  return `${alert.title}\n${body}`.trim();
}
