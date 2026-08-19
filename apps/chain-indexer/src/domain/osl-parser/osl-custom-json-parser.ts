import { Injectable, Logger } from '@nestjs/common';
import { encodeEventSeq } from '@opden-data-layer/core';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { dispatchEnvelope } from '../odl-shared';
import type { OdlActionHandler } from '../odl-shared';
import { GovernanceCacheService } from '../governance/governance-cache.service';
import { oslEnvelopeSchema } from './osl-envelope.schema';
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

@Injectable()
export class OslCustomJsonParser {
  private readonly logger = new Logger(OslCustomJsonParser.name);
  private readonly handlerMap: Record<string, OdlActionHandler>;

  constructor(
    private readonly hiveEngineDepositHandler: HiveEngineDepositHandler,
    private readonly userNotificationSettingsHandler: UserNotificationSettingsHandler,
    private readonly userMetadataHandler: UserMetadataHandler,
    private readonly channelCreateHandler: ChannelCreateHandler,
    private readonly channelAliasRegisterHandler: ChannelAliasRegisterHandler,
    private readonly channelMemberAddHandler: ChannelMemberAddHandler,
    private readonly channelMemberRemoveHandler: ChannelMemberRemoveHandler,
    private readonly channelLeaveHandler: ChannelLeaveHandler,
    private readonly channelUpdateHandler: ChannelUpdateHandler,
    private readonly messageCreateHandler: MessageCreateHandler,
    private readonly messageDeleteHandler: MessageDeleteHandler,
    private readonly messageContextExcludeHandler: MessageContextExcludeHandler,
    private readonly governanceCache: GovernanceCacheService,
  ) {
    this.handlerMap = {
      [this.hiveEngineDepositHandler.action]: this.hiveEngineDepositHandler,
      [this.userNotificationSettingsHandler.action]: this.userNotificationSettingsHandler,
      [this.userMetadataHandler.action]: this.userMetadataHandler,
      [this.channelCreateHandler.action]: this.channelCreateHandler,
      [this.channelAliasRegisterHandler.action]: this.channelAliasRegisterHandler,
      [this.channelMemberAddHandler.action]: this.channelMemberAddHandler,
      [this.channelMemberRemoveHandler.action]: this.channelMemberRemoveHandler,
      [this.channelLeaveHandler.action]: this.channelLeaveHandler,
      [this.channelUpdateHandler.action]: this.channelUpdateHandler,
      [this.messageCreateHandler.action]: this.messageCreateHandler,
      [this.messageDeleteHandler.action]: this.messageDeleteHandler,
      [this.messageContextExcludeHandler.action]: this.messageContextExcludeHandler,
    };
  }

  async parse(
    rawJson: string,
    account: string,
    hiveCtx: HiveOperationHandlerContext,
  ): Promise<void> {
    await dispatchEnvelope(rawJson, {
      schema: oslEnvelopeSchema,
      handlerMap: this.handlerMap,
      governanceCache: this.governanceCache,
      logger: this.logger,
      encodeEventSeq,
      hiveCtx,
      account,
      unknownActionLabel: 'OSL: unknown action',
      skipPlatformBannedCheck: true,
    });
  }
}
