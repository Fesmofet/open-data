import type { Migration, MigrationProvider } from 'kysely';
import { MIGRATIONS } from './postgres/odl';

/**
 * Provides bundled ODL migrations to Kysely Migrator.
 * Migrations run in alphanumeric order (00001_initial_odl_schema, ...).
 */
export class OdlMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return MIGRATIONS;
  }
}
