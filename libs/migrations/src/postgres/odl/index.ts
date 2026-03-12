import * as m00001 from './00001_initial_odl_schema';
import type { Migration } from 'kysely';

/** Ordered migrations for OdlMigrationProvider. Schema matches @opden-data-layer/core OdlDatabase and spec/postgres-concept/schema.sql */
export const MIGRATIONS: Record<string, Migration> = {
  '00001_initial_odl_schema': { up: m00001.up, down: m00001.down },
};
