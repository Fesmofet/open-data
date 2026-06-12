import { Controller, Get, Header, NotFoundException, Param, Query } from '@nestjs/common';
import { ReqLocale, type SupportedCurrency } from '@opden-data-layer/core';
import {
  GetPostByKeyEndpoint,
  GetPostDiscussionEndpoint,
  GetPostVotersEndpoint,
  type PostDiscussionResponseDto,
  type PostVotersPageDto,
  type SinglePostViewDto,
} from '../domain/feed';
import { postVotersQuerySchema } from '../domain/feed/schemas/post-voters.schema';
import { ReqCurrency } from '../http/currency-query.decorator';
import { ReqGovernanceObjectId } from '../http/governance-object-id.decorator';
import { ReqViewer } from '../http/viewer-header.decorator';
import { ZodQueryPipe } from '../pipes';
import type { PostVotersQuery } from '../domain/feed/schemas/post-voters.schema';

@Controller({ path: 'posts', version: '1' })
export class PostsController {
  constructor(
    private readonly getPostByKey: GetPostByKeyEndpoint,
    private readonly getPostDiscussion: GetPostDiscussionEndpoint,
    private readonly getPostVoters: GetPostVotersEndpoint,
  ) {}

  @Get(':author/:permlink')
  async getPost(
    @Param('author') author: string,
    @Param('permlink') permlink: string,
    @ReqLocale() locale: string,
    @ReqGovernanceObjectId() governanceObjectIdFromHeader: string | undefined,
    @ReqViewer() viewer: string | undefined,
    @ReqCurrency() currency: SupportedCurrency,
  ): Promise<SinglePostViewDto> {
    const result = await this.getPostByKey.execute(
      author,
      permlink,
      locale,
      governanceObjectIdFromHeader,
      viewer,
      currency,
    );
    if (!result) {
      throw new NotFoundException(`Post not found: ${author}/${permlink}`);
    }
    return result;
  }

  @Get(':author/:permlink/voters')
  @Header('Cache-Control', 'no-store')
  async getVoters(
    @Param('author') author: string,
    @Param('permlink') permlink: string,
    @Query(new ZodQueryPipe(postVotersQuerySchema)) query: PostVotersQuery,
    @ReqCurrency() currency: SupportedCurrency,
  ): Promise<PostVotersPageDto> {
    const result = await this.getPostVoters.execute(
      author,
      permlink,
      query,
      currency,
    );
    if (!result) {
      throw new NotFoundException(`Voters not found: ${author}/${permlink}`);
    }
    return result;
  }

  @Get(':author/:permlink/discussion')
  @Header('Cache-Control', 'no-store')
  async getDiscussion(
    @Param('author') author: string,
    @Param('permlink') permlink: string,
    @ReqViewer() viewer: string | undefined,
    @ReqCurrency() currency: SupportedCurrency,
  ): Promise<PostDiscussionResponseDto> {
    const result = await this.getPostDiscussion.execute(
      author,
      permlink,
      viewer,
      currency,
    );
    if (!result) {
      throw new NotFoundException(`Discussion not found: ${author}/${permlink}`);
    }
    return result;
  }
}
