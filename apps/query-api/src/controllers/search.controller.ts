import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReqLocale } from '@opden-data-layer/core';
import {
  GetSearchCountsEndpoint,
  GetSearchEndpoint,
  GetSearchObjectsByIdsEndpoint,
  searchCountsQuerySchema,
  searchObjectsByIdsBodySchema,
  searchQuerySchema,
  type SearchCountsQuery,
  type SearchCountsResponseDto,
  type SearchObjectsByIdsBody,
  type SearchObjectsByIdsResponseDto,
  type SearchQuery,
  type SearchResponseDto,
} from '../domain/search';
import { ReqGovernanceObjectId } from '../http/governance-object-id.decorator';
import { ReqViewer } from '../http/viewer-header.decorator';
import { ZodBodyPipe, ZodQueryPipe } from '../pipes';

@Controller({ path: 'search', version: ['1', '2'] })
export class SearchController {
  constructor(
    private readonly getSearch: GetSearchEndpoint,
    private readonly getSearchCounts: GetSearchCountsEndpoint,
    private readonly getSearchObjectsByIds: GetSearchObjectsByIdsEndpoint,
  ) {}

  @Get()
  async search(
    @Query(new ZodQueryPipe(searchQuerySchema)) query: SearchQuery,
    @ReqLocale() locale: string,
    @ReqViewer() viewer: string | undefined,
    @ReqGovernanceObjectId() governanceObjectIdFromHeader: string | undefined,
  ): Promise<SearchResponseDto> {
    return this.getSearch.execute({
      q: query.q,
      locale,
      limit: query.limit,
      type: query.type,
      viewerAccount: viewer,
      governanceObjectIdFromHeader,
    });
  }

  @Get('counts')
  async searchCounts(
    @Query(new ZodQueryPipe(searchCountsQuerySchema)) query: SearchCountsQuery,
  ): Promise<SearchCountsResponseDto> {
    return this.getSearchCounts.execute({ q: query.q });
  }

  @Post('objects-by-ids')
  async searchObjectsByIds(
    @Body(new ZodBodyPipe(searchObjectsByIdsBodySchema)) body: SearchObjectsByIdsBody,
    @ReqLocale() locale: string,
    @ReqViewer() viewer: string | undefined,
    @ReqGovernanceObjectId() governanceObjectIdFromHeader: string | undefined,
  ): Promise<SearchObjectsByIdsResponseDto> {
    return this.getSearchObjectsByIds.execute({
      ...body,
      locale,
      viewerAccount: viewer,
      governanceObjectIdFromHeader,
    });
  }
}
