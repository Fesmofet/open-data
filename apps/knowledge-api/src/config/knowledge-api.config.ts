import * as path from 'node:path';
import { validateKnowledgeApiEnv } from './env.validation';

export default () => {
  const env = validateKnowledgeApiEnv(
    process.env as unknown as Record<string, unknown>,
  );
  return {
    port: env.PORT,
    postgres: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      database: env.POSTGRES_DATABASE,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      poolMax: env.POSTGRES_POOL_MAX,
    },
    knowledge: {
      allowReindex: env.KNOWLEDGE_ALLOW_REINDEX ?? false,
      workspaceRoot:
        env.KNOWLEDGE_WORKSPACE_ROOT?.trim() ||
        path.resolve(process.cwd()),
    },
  };
};
