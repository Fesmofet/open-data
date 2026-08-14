import { z } from 'zod';

import { DEFAULT_SIGNING_MODE, type SigningMode } from '../constants/signing';

const boolEnv = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const signingModeEnv = z
  .enum(['has', 'local'])
  .optional()
  .default(DEFAULT_SIGNING_MODE);

export const agentWalletConfigSchema = z.object({
  PORT: z.coerce.number().optional().default(7500),
  HOST: z.string().min(1).optional().default('127.0.0.1'),
  ODL_NETWORK: z.enum(['mainnet', 'testnet']).optional().default('testnet'),
  HAS_WS_URL: z
    .string()
    .min(1)
    .optional()
    .default('wss://hive-auth.arcange.eu'),
  HAS_APP_NAME: z.string().min(1).optional().default('ODL Agent'),
  HAS_WEB_LINK_BASE: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) {
        return 'https://waiviodev.com';
      }
      const trimmed = v.trim();
      if (!trimmed) {
        return '';
      }
      return trimmed.replace(/\/$/, '');
    }),
  WAIVIO_API_ORIGIN: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = (v ?? 'https://waiviodev.com').trim();
      return trimmed.replace(/\/$/, '') || 'https://waiviodev.com';
    }),
  AGENT_WALLET_SIGNING_MODE: signingModeEnv,
  HIVE_ACCOUNT: z.string().optional(),
  HIVE_POSTING_KEY: z.string().optional(),
  HIVE_ACTIVE_KEY: z.string().optional(),
  HIVE_RPC_NODES: z
    .string()
    .optional()
    .transform((s) =>
      s
        ?.split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  AGENT_WALLET_DATA_DIR: z.string().optional(),
  AGENT_WALLET_NO_PERSIST: boolEnv,
  AGENT_WALLET_BEARER_TOKEN: z.string().min(16).optional(),
});

export type AgentWalletEnv = z.infer<typeof agentWalletConfigSchema>;
export type { SigningMode };

export function validateAgentWalletEnv(
  config: Record<string, unknown>,
): AgentWalletEnv {
  const result = agentWalletConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }
  return result.data;
}
