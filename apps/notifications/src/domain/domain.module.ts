import { Module, forwardRef } from '@nestjs/common';
import { RedisClientModule } from '@opden-data-layer/clients';
import { CurrencyModule } from '@opden-data-layer/currency';
import { KYSELY } from '../database';
import { RepositoriesModule } from '../repositories/repositories.module';
import { WsModule } from '../ws/ws.module';
import { NotificationFeedService } from './notification-feed.service';
import { NotificationRouterService } from './notification-router.service';
import {
  DirectRecipientStrategy,
  ObjectAudienceRecipientStrategy,
  PostAuthorRecipientStrategy,
  RecipientStrategyRegistry,
  SelfActorRecipientStrategy,
  ThreadAuthorFollowerRecipientStrategy,
  UserBellRecipientStrategy,
} from './routing/recipient-strategies';
import { NotificationSettingsService } from './settings/notification-settings.service';

@Module({
  imports: [
    RedisClientModule,
    RepositoriesModule,
    CurrencyModule.register({ kyselyToken: KYSELY, includeCollectService: false }),
    forwardRef(() => WsModule),
  ],
  providers: [
    NotificationFeedService,
    NotificationRouterService,
    DirectRecipientStrategy,
    PostAuthorRecipientStrategy,
    SelfActorRecipientStrategy,
    ObjectAudienceRecipientStrategy,
    UserBellRecipientStrategy,
    ThreadAuthorFollowerRecipientStrategy,
    RecipientStrategyRegistry,
    NotificationSettingsService,
  ],
  exports: [NotificationRouterService, NotificationFeedService],
})
export class DomainModule {}
