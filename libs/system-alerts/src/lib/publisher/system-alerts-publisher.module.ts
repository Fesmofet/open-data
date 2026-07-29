import { Module } from '@nestjs/common';
import { RedisClientModule } from '@opden-data-layer/clients';
import { SystemAlertPublisherService } from './system-alert-publisher.service';

@Module({
  imports: [RedisClientModule],
  providers: [SystemAlertPublisherService],
  exports: [SystemAlertPublisherService],
})
export class SystemAlertsPublisherModule {}
