import {
  getMigrationStatus,
  migrateDown,
  migrateToLatest,
} from './runner';

const DATABASE_URL = process.env['DATABASE_URL'];

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function run(): Promise<void> {
  if (!DATABASE_URL?.trim()) {
    fail('DATABASE_URL is required. Set it in the environment or .env.');
  }

  const command = process.argv[2] ?? 'latest';
  const config = { connectionString: DATABASE_URL };

  switch (command) {
    case 'latest': {
      const result = await migrateToLatest(config);
      if (result.error) {
        console.error('Migration failed:', result.error);
        process.exit(1);
      }
      const run = result.results ?? [];
      if (run.length === 0) {
        console.log('No pending migrations.');
      } else {
        for (const r of run) {
          if (r.status === 'Success') {
            console.log(`Applied: ${r.migrationName}`);
          } else if (r.status === 'Error') {
            console.error(`Failed: ${r.migrationName}`);
            process.exit(1);
          }
        }
      }
      return;
    }
    case 'down': {
      const result = await migrateDown(config);
      if (result.error) {
        console.error('Rollback failed:', result.error);
        process.exit(1);
      }
      const run = result.results ?? [];
      if (run.length === 0) {
        console.log('No migration to roll back.');
      } else {
        for (const r of run) {
          if (r.status === 'Success') {
            console.log(`Rolled back: ${r.migrationName}`);
          } else if (r.status === 'Error') {
            console.error(`Rollback failed: ${r.migrationName}`);
            process.exit(1);
          }
        }
      }
      return;
    }
    case 'status': {
      const status = await getMigrationStatus(config);
      for (const s of status) {
        const at = s.executedAt
          ? s.executedAt.toISOString()
          : 'pending';
        console.log(`${s.name}\t${at}`);
      }
      return;
    }
    default: {
      fail(
        `Unknown command: ${command}. Use: latest | down | status`
      );
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
