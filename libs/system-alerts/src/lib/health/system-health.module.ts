import { DynamicModule, Module, type FactoryProvider } from '@nestjs/common';
import { RedisClientModule } from '@opden-data-layer/clients';
import {
  SYSTEM_HEALTH_OPTIONS,
  SystemHealthCheckService,
  type SystemHealthModuleOptions,
} from './system-health-check.service';

@Module({})
export class SystemHealthModule {
  static forRoot(options: SystemHealthModuleOptions): DynamicModule {
    return {
      module: SystemHealthModule,
      imports: [RedisClientModule],
      providers: [
        { provide: SYSTEM_HEALTH_OPTIONS, useValue: options },
        SystemHealthCheckService,
      ],
      exports: [SystemHealthCheckService],
    };
  }

  static forRootAsync(options: {
    imports?: DynamicModule['imports'];
    useFactory: FactoryProvider<SystemHealthModuleOptions>['useFactory'];
    inject?: FactoryProvider['inject'];
  }): DynamicModule {
    return {
      module: SystemHealthModule,
      imports: [RedisClientModule, ...(options.imports ?? [])],
      providers: [
        {
          provide: SYSTEM_HEALTH_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        SystemHealthCheckService,
      ],
      exports: [SystemHealthCheckService],
    };
  }
}
