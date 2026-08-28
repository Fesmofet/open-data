import {
  DynamicModule,
  Module,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
} from '@nestjs/common';

import { ChangellyClient } from './changelly-client';
import {
  CHANGELLY_CLIENT_MODULE_OPTIONS,
  type ChangellyClientModuleOptions,
} from './changelly-client.options';

@Module({})
export class ChangellyClientModule {
  static forRoot(options: ChangellyClientModuleOptions): DynamicModule {
    return {
      module: ChangellyClientModule,
      global: true,
      providers: [
        { provide: CHANGELLY_CLIENT_MODULE_OPTIONS, useValue: options },
        ChangellyClient,
      ],
      exports: [ChangellyClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => ChangellyClientModuleOptions | Promise<ChangellyClientModuleOptions>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    return {
      module: ChangellyClientModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: CHANGELLY_CLIENT_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ChangellyClient,
      ],
      exports: [ChangellyClient],
    };
  }
}
