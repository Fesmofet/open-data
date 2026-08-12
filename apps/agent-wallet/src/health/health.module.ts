import { Module } from '@nestjs/common';

import { DomainModule } from '../domain/domain.module';
import { HealthController } from './health.controller';

@Module({
  imports: [DomainModule],
  controllers: [HealthController],
})
export class HealthModule {}
