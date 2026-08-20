import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';
import { RepositoriesModule } from '../../repositories';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { OslCustomJsonParser } from './osl-custom-json-parser';
import { HiveEngineDepositHandler } from './handlers/hive-engine-deposit.handler';
import { UserNotificationSettingsHandler } from './handlers/user-notification-settings.handler';
import { UserMetadataHandler } from './handlers/user-metadata.handler';
import { ChannelCreateHandler } from './handlers/channel-create.handler';
import { ChannelAliasRegisterHandler } from './handlers/channel-alias-register.handler';
import { ChannelMemberAddHandler } from './handlers/channel-member-add.handler';
import { ChannelMemberRemoveHandler } from './handlers/channel-member-remove.handler';
import { ChannelLeaveHandler } from './handlers/channel-leave.handler';
import { ChannelUpdateHandler } from './handlers/channel-update.handler';
import { MessageCreateHandler } from './handlers/message-create.handler';
import { MessageDeleteHandler } from './handlers/message-delete.handler';
import { MessageContextExcludeHandler } from './handlers/message-context-exclude.handler';

const messagingHandlers = [
  ChannelCreateHandler,
  ChannelAliasRegisterHandler,
  ChannelMemberAddHandler,
  ChannelMemberRemoveHandler,
  ChannelLeaveHandler,
  ChannelUpdateHandler,
  MessageCreateHandler,
  MessageDeleteHandler,
  MessageContextExcludeHandler,
];

@Module({
  imports: [RepositoriesModule, GovernanceModule, NotificationAdapterModule],
  providers: [
    OslCustomJsonParser,
    HiveEngineDepositHandler,
    UserNotificationSettingsHandler,
    UserMetadataHandler,
    ...messagingHandlers,
  ],
  exports: [
    OslCustomJsonParser,
    UserMetadataHandler,
    ...messagingHandlers,
  ],
})
export class OslParserModule {}
