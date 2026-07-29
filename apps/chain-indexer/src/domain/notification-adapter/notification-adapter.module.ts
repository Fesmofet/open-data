import { Module } from '@nestjs/common';
import { ObjectsDomainModule } from '@opden-data-layer/objects-domain';
import { RepositoriesModule } from '../../repositories';
import { GovernanceModule } from '../governance/governance.module';
import { NotificationAdapterService } from './notification-adapter.service';
import { NotificationEmitterService } from './notification-emitter.service';
import { ObjectNameResolverService } from './object-name-resolver.service';
import { NOTIFICATION_PUBLISHER } from './notification-publisher.interface';
import { RedisStreamNotificationPublisher } from './publishers/redis-stream.publisher';

@Module({
  imports: [RepositoriesModule, ObjectsDomainModule, GovernanceModule],
  providers: [
    NotificationAdapterService,
    NotificationEmitterService,
    ObjectNameResolverService,
    {
      provide: NOTIFICATION_PUBLISHER,
      useClass: RedisStreamNotificationPublisher,
    },
  ],
  exports: [NotificationEmitterService],
})
export class NotificationAdapterModule {}
