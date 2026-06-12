import { DynamicModule, Module } from '@nestjs/common';
import { HiveEngineHistoryClient } from './hive-engine-history-client';
import {
  HIVE_ENGINE_HISTORY_CLIENT_MODULE_OPTIONS,
  HiveEngineHistoryClientModuleOptions,
} from './hive-engine-history-client.options';

@Module({})
export class HiveEngineHistoryClientModule {
  static forRoot(options: HiveEngineHistoryClientModuleOptions): DynamicModule {
    return {
      module: HiveEngineHistoryClientModule,
      global: true,
      providers: [
        { provide: HIVE_ENGINE_HISTORY_CLIENT_MODULE_OPTIONS, useValue: options },
        HiveEngineHistoryClient,
      ],
      exports: [HiveEngineHistoryClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) =>
      | HiveEngineHistoryClientModuleOptions
      | Promise<HiveEngineHistoryClientModuleOptions>;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    return {
      module: HiveEngineHistoryClientModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: HIVE_ENGINE_HISTORY_CLIENT_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        HiveEngineHistoryClient,
      ],
      exports: [HiveEngineHistoryClient],
    };
  }
}
