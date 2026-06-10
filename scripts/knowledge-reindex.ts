import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import {
  runKnowledgeReindex,
  resolveWorkspaceRoot,
  type KnowledgeDatabase,
} from '../libs/knowledge/src';

async function main(): Promise<void> {
  const pathArg = process.argv[2]?.startsWith('--path=')
    ? process.argv[2].slice('--path='.length)
    : undefined;

  const connectionString = resolveConnectionString();
  const db = new Kysely<KnowledgeDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });

  try {
    const stats = await runKnowledgeReindex(db, {
      workspaceRoot: resolveWorkspaceRoot(),
      pathFilter: pathArg,
    });
    // eslint-disable-next-line no-console
    console.log(
      `Knowledge reindex done: indexed=${stats.indexed} skipped=${stats.skipped} deleted=${stats.deleted} chunks=${stats.chunks} durationMs=${stats.durationMs}`,
    );
  } finally {
    await db.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
