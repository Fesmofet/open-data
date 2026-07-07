import {
  DynamicModule,
  Module,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
} from '@nestjs/common';

import { HiveEngineConvertClient } from './hive-engine-convert-client';
import {
  HIVE_ENGINE_CONVERT_CLIENT_MODULE_OPTIONS,
  type HiveEngineConvertClientModuleOptions,
} from './hive-engine-convert-client.options';

@Module({})
export class HiveEngineConvertClientModule {
  static forRoot(options: HiveEngineConvertClientModuleOptions): DynamicModule {
    return {
      module: HiveEngineConvertClientModule,
      global: true,
      providers: [
        { provide: HIVE_ENGINE_CONVERT_CLIENT_MODULE_OPTIONS, useValue: options },
        HiveEngineConvertClient,
      ],
      exports: [HiveEngineConvertClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) =>
      | HiveEngineConvertClientModuleOptions
      | Promise<HiveEngineConvertClientModuleOptions>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    return {
      module: HiveEngineConvertClientModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: HIVE_ENGINE_CONVERT_CLIENT_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        HiveEngineConvertClient,
      ],
      exports: [HiveEngineConvertClient],
    };
  }
}
