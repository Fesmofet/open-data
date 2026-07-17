import {
  DynamicModule,
  Module,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
} from '@nestjs/common';
import { ExchangeRateClient } from './exchange-rate-client';
import {
  EXCHANGE_RATE_CLIENT_MODULE_OPTIONS,
  type ExchangeRateClientModuleOptions,
} from './exchange-rate-client.options';

@Module({})
export class ExchangeRateClientModule {
  static forRoot(options: ExchangeRateClientModuleOptions): DynamicModule {
    return {
      module: ExchangeRateClientModule,
      global: true,
      providers: [
        { provide: EXCHANGE_RATE_CLIENT_MODULE_OPTIONS, useValue: options },
        ExchangeRateClient,
      ],
      exports: [ExchangeRateClient],
    };
  }

  static forRootAsync(options: {
    // Nest inject factories are typed loosely; callers narrow injected tokens.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (
      ...args: any[]
    ) =>
      | ExchangeRateClientModuleOptions
      | Promise<ExchangeRateClientModuleOptions>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    return {
      module: ExchangeRateClientModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: EXCHANGE_RATE_CLIENT_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ExchangeRateClient,
      ],
      exports: [ExchangeRateClient],
    };
  }
}
