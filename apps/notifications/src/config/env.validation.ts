import { z } from 'zod';
import { HIVE_ENGINE_NODES } from '@opden-data-layer/clients';

const DEFAULT_HIVE_ENGINE_NODES = [...HIVE_ENGINE_NODES];

export const notificationsEnvSchema = z.object({
  PORT: z.coerce.number().optional().default(7200),
  JWT_SECRET: z.string().min(16),
  REDIS_URI: z.string().optional().default('redis://localhost:6379'),
  POSTGRES_HOST: z.string().min(1).optional().default('localhost'),
  POSTGRES_PORT: z.coerce.number().optional().default(5432),
  POSTGRES_DATABASE: z.string().min(1).optional().default('odl'),
  POSTGRES_USER: z.string().min(1).optional().default('postgres'),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_POOL_MAX: z.coerce.number().optional().default(25),
  SUBSCRIPTION_TTL_SECONDS: z.coerce.number().optional().default(300),
  WS_PING_INTERVAL_MS: z.coerce.number().optional().default(30_000),
  WS_PING_TIMEOUT_MS: z.coerce.number().optional().default(10_000),
  WS_MAX_CONNECTIONS_PER_USER: z.coerce.number().int().min(1).optional().default(5),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  WEB_PUBLIC_ORIGIN: z.string().url().optional().default('http://localhost:3000'),
  TELEGRAM_POLL_TIMEOUT_SEC: z.coerce.number().optional().default(30),
  TELEGRAM_SEND_RATE_PER_SEC: z.coerce.number().optional().default(25),
  TELEGRAM_OPS_BOT_TOKEN: z.string().optional(),
  HIVE_ENGINE_NODES: z
    .string()
    .optional()
    .transform((s) => {
      if (!s || s.trim().length === 0) {
        return [...DEFAULT_HIVE_ENGINE_NODES];
      }
      const parsed = s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      return parsed.length > 0 ? parsed : [...DEFAULT_HIVE_ENGINE_NODES];
    }),
  SYSTEM_HEALTH_BLOCK_LAG_BUFFER: z.coerce.number().optional().default(100),
  NOTIFICATIONS_CONSUMER_NAME: z
    .string()
    .min(1)
    .optional()
    .default('notifications-1'),
});

export type NotificationsEnv = z.infer<typeof notificationsEnvSchema>;

export function validateNotificationsEnv(
  config: Record<string, unknown>,
): NotificationsEnv {
  const result = notificationsEnvSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }
  return result.data;
}
