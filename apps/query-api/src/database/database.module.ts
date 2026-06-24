import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types as pgTypes } from 'pg';
import type { Database } from './types';

export const KYSELY = Symbol('KYSELY');

/**
 * node-pg parses `DATE` (OID 1082) into a JS `Date` at the runtime's LOCAL midnight,
 * which shifts the calendar day backwards in any non-UTC runtime (e.g. UTC+2/+3).
 * Keep `DATE` columns as raw `YYYY-MM-DD` strings so per-date lookups (currency_rates,
 * hive_engine_rates) stay aligned. Mongo stored these as `dateString`; this preserves parity.
 */
pgTypes.setTypeParser(pgTypes.builtins.DATE, (value) => value);

@Global()
@Module({
  providers: [
    {
      provide: KYSELY,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const postgres = config.get<{
          host: string;
          port: number;
          database: string;
          user: string;
          password?: string;
          poolMax: number;
        }>('postgres');
        if (!postgres) {
          throw new Error('Database module: postgres config is missing');
        }
        const dialect = new PostgresDialect({
          pool: new Pool({
            host: postgres.host,
            port: postgres.port,
            database: postgres.database,
            user: postgres.user,
            password: postgres.password,
            max: postgres.poolMax,
          }),
        });
        return new Kysely<Database>({ dialect });
      },
    },
  ],
  exports: [KYSELY],
})
export class DatabaseModule {}
