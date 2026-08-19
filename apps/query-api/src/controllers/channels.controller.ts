import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ReqGovernanceObjectId } from '../http/governance-object-id.decorator';
import { ReqViewer } from '../http/viewer-header.decorator';
import { ZodBodyPipe, ZodQueryPipe } from '../pipes';
import {
  GetChannelsEndpoint,
  GetChannelByIdEndpoint,
  GetChannelByAliasEndpoint,
  GetChannelMessagesEndpoint,
  MarkChannelReadEndpoint,
} from '../domain/messaging';
import {
  channelListQuerySchema,
  messageHistoryBodySchema,
  markChannelReadBodySchema,
  type ChannelListQuery,
  type MessageHistoryBody,
  type MarkChannelReadBody,
} from '../domain/messaging/schemas/messaging.schema';

@Controller({ path: 'channels', version: ['1', '2'] })
export class ChannelsController {
  constructor(
    private readonly getChannels: GetChannelsEndpoint,
    private readonly getChannelById: GetChannelByIdEndpoint,
    private readonly getChannelByAlias: GetChannelByAliasEndpoint,
    private readonly getChannelMessages: GetChannelMessagesEndpoint,
    private readonly markChannelRead: MarkChannelReadEndpoint,
  ) {}

  @Get()
  getViewerChannels(
    @ReqViewer() viewer: string | undefined,
    @Query(new ZodQueryPipe(channelListQuerySchema)) query: ChannelListQuery,
  ) {
    return this.getChannels.execute(viewer ?? '', query);
  }

  @Get('by-alias/:alias')
  async getByAlias(@Param('alias') alias: string, @ReqViewer() viewer?: string) {
    const result = await this.getChannelByAlias.execute(alias, viewer);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }

  @Get(':channelId')
  async getById(@Param('channelId') channelId: string, @ReqViewer() viewer?: string) {
    const result = await this.getChannelById.execute(channelId, viewer);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }

  @Post(':channelId/messages')
  async getMessages(
    @Param('channelId') channelId: string,
    @Body(new ZodBodyPipe(messageHistoryBodySchema)) body: MessageHistoryBody,
    @ReqViewer() viewer?: string,
  ) {
    const result = await this.getChannelMessages.execute(channelId, body, viewer);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }

  @Post(':channelId/read')
  markRead(
    @Param('channelId') channelId: string,
    @Body(new ZodBodyPipe(markChannelReadBodySchema)) body: MarkChannelReadBody,
    @ReqViewer() viewer: string | undefined,
  ) {
    return this.markChannelRead.execute(
      channelId,
      viewer ?? '',
      body.last_read_at_unix,
    );
  }
}
