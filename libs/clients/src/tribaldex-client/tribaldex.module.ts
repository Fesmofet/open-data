import {
  DynamicModule,
  Module,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
} from '@nestjs/common';

import { TribaldexClient } from './tribaldex-client';
import {
  TRIBALDEX_CLIENT_MODULE_OPTIONS,
  type TribaldexClientModuleOptions,
} from './tribaldex-client.options';

@Module({})
export class TribaldexClientModule {
  static forRoot(options: TribaldexClientModuleOptions): DynamicModule {
    return {
      module: TribaldexClientModule,
      global: true,
      providers: [
        { provide: TRIBALDEX_CLIENT_MODULE_OPTIONS, useValue: options },
        TribaldexClient,
      ],
      exports: [TribaldexClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => TribaldexClientModuleOptions | Promise<TribaldexClientModuleOptions>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    return {
      module: TribaldexClientModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: TRIBALDEX_CLIENT_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        TribaldexClient,
      ],
      exports: [TribaldexClient],
    };
  }
}
