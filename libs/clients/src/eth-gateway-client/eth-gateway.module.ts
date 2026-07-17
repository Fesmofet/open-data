import {
  DynamicModule,
  Module,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
} from '@nestjs/common';

import { EthGatewayClient } from './eth-gateway-client';
import {
  ETH_GATEWAY_CLIENT_MODULE_OPTIONS,
  type EthGatewayClientModuleOptions,
} from './eth-gateway-client.options';

@Module({})
export class EthGatewayClientModule {
  static forRoot(options: EthGatewayClientModuleOptions): DynamicModule {
    return {
      module: EthGatewayClientModule,
      global: true,
      providers: [
        { provide: ETH_GATEWAY_CLIENT_MODULE_OPTIONS, useValue: options },
        EthGatewayClient,
      ],
      exports: [EthGatewayClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => EthGatewayClientModuleOptions | Promise<EthGatewayClientModuleOptions>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    return {
      module: EthGatewayClientModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: ETH_GATEWAY_CLIENT_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        EthGatewayClient,
      ],
      exports: [EthGatewayClient],
    };
  }
}
