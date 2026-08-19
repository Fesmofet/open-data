import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { GovernanceModule } from '../governance';
import { GetChannelsEndpoint } from './get-channels.endpoint';
import { GetChannelByIdEndpoint } from './get-channel-by-id.endpoint';
import { GetChannelByAliasEndpoint } from './get-channel-by-alias.endpoint';
import { GetChannelMessagesEndpoint } from './get-channel-messages.endpoint';
import {
  GetObjectChannelEndpoint,
  GetObjectChannelMessagesEndpoint,
} from './get-object-channel.endpoint';
import { MarkChannelReadEndpoint } from './mark-channel-read.endpoint';

@Module({
  imports: [RepositoriesModule, GovernanceModule],
  providers: [
    GetChannelsEndpoint,
    GetChannelByIdEndpoint,
    GetChannelByAliasEndpoint,
    GetChannelMessagesEndpoint,
    GetObjectChannelEndpoint,
    GetObjectChannelMessagesEndpoint,
    MarkChannelReadEndpoint,
  ],
  exports: [
    GetChannelsEndpoint,
    GetChannelByIdEndpoint,
    GetChannelByAliasEndpoint,
    GetChannelMessagesEndpoint,
    GetObjectChannelEndpoint,
    GetObjectChannelMessagesEndpoint,
    MarkChannelReadEndpoint,
  ],
})
export class MessagingModule {}
