import { z } from 'zod';

export const knowledgeApiConfigSchema = z.object({
  PORT: z.coerce.number().optional().default(7400),
  POSTGRES_HOST: z.string().min(1).optional().default('localhost'),
  POSTGRES_PORT: z.coerce.number().optional().default(5432),
  POSTGRES_DATABASE: z.string().min(1).optional().default('odl'),
  POSTGRES_USER: z.string().min(1).optional().default('postgres'),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_POOL_MAX: z.coerce.number().optional().default(10),
  KNOWLEDGE_ALLOW_REINDEX: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  KNOWLEDGE_WORKSPACE_ROOT: z.string().optional(),
});

export type KnowledgeApiEnv = z.infer<typeof knowledgeApiConfigSchema>;

export function validateKnowledgeApiEnv(
  config: Record<string, unknown>,
): KnowledgeApiEnv {
  const result = knowledgeApiConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }
  return result.data;
}
