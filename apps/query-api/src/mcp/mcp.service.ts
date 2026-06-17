import { Injectable, Logger } from '@nestjs/common';
import { CurrencyQueryService } from '@opden-data-layer/currency';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { GetUserCategoriesEndpoint } from '../domain/categories/get-user-categories.endpoint';
import {
  GetDiscoverObjectsEndpoint,
  GetDiscoverTagCategoriesEndpoint,
  GetDiscoverUsersEndpoint,
} from '../domain/discover';
import {
  GetPostByKeyEndpoint,
  GetPostDiscussionEndpoint,
  GetPostVotersEndpoint,
  GetUserBlogFeedEndpoint,
  GetUserBlogObjectFiltersEndpoint,
  GetUserCommentsFeedEndpoint,
  GetUserMentionsFeedEndpoint,
  GetUserThreadsFeedEndpoint,
} from '../domain/feed';
import { GetObjectUpdatesFeedEndpoint } from '../domain/object-updates/get-object-updates-feed.endpoint';
import { GetUpdateVotersEndpoint } from '../domain/object-updates/get-update-voters.endpoint';
import {
  CheckObjectExistsEndpoint,
  GetNestedObjectsEndpoint,
  GetObjectAuthorityEndpoint,
  GetObjectByIdEndpoint,
  GetObjectFollowersEndpoint,
  GetObjectRefListEndpoint,
  GetObjectRelatedAlbumEndpoint,
  GetObjectRelatedAlbumPreviewEndpoint,
} from '../domain/objects';
import { GetSearchCountsEndpoint } from '../domain/search/get-search-counts.endpoint';
import { GetSearchEndpoint } from '../domain/search/get-search.endpoint';
import {
  GetUserShopObjectsEndpoint,
  GetUserShopSectionsEndpoint,
} from '../domain/shop';
import {
  GetUserFollowersEndpoint,
  GetUserFollowingEndpoint,
  GetUserFollowingObjectsEndpoint,
} from '../domain/social';
import { GetUserProfileEndpoint } from '../domain/users';
import { QUERY_API_MCP_INSTRUCTIONS } from './mcp-instructions';
import type { McpToolDeps } from './mcp-tool.deps';
import { registerAllMcpTools } from './register-all-tools';
import { registerQueryMcpResources } from './register-query-mcp-resources';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private readonly search: GetSearchEndpoint,
    private readonly searchCounts: GetSearchCountsEndpoint,
    private readonly discoverObjects: GetDiscoverObjectsEndpoint,
    private readonly discoverUsers: GetDiscoverUsersEndpoint,
    private readonly discoverTagCategories: GetDiscoverTagCategoriesEndpoint,
    private readonly getObjectById: GetObjectByIdEndpoint,
    private readonly getNestedObjects: GetNestedObjectsEndpoint,
    private readonly checkObjectExists: CheckObjectExistsEndpoint,
    private readonly getObjectRefList: GetObjectRefListEndpoint,
    private readonly getObjectRelatedAlbumPreview: GetObjectRelatedAlbumPreviewEndpoint,
    private readonly getObjectRelatedAlbum: GetObjectRelatedAlbumEndpoint,
    private readonly getObjectFollowers: GetObjectFollowersEndpoint,
    private readonly getObjectAuthority: GetObjectAuthorityEndpoint,
    private readonly getObjectUpdatesFeed: GetObjectUpdatesFeedEndpoint,
    private readonly getUpdateVoters: GetUpdateVotersEndpoint,
    private readonly getUserProfile: GetUserProfileEndpoint,
    private readonly getUserBlogFeed: GetUserBlogFeedEndpoint,
    private readonly getUserBlogObjectFilters: GetUserBlogObjectFiltersEndpoint,
    private readonly getUserMentionsFeed: GetUserMentionsFeedEndpoint,
    private readonly getUserThreadsFeed: GetUserThreadsFeedEndpoint,
    private readonly getUserCommentsFeed: GetUserCommentsFeedEndpoint,
    private readonly getUserFollowers: GetUserFollowersEndpoint,
    private readonly getUserFollowing: GetUserFollowingEndpoint,
    private readonly getUserFollowingObjects: GetUserFollowingObjectsEndpoint,
    private readonly getUserCategories: GetUserCategoriesEndpoint,
    private readonly getUserShopObjects: GetUserShopObjectsEndpoint,
    private readonly getUserShopSections: GetUserShopSectionsEndpoint,
    private readonly getPostByKey: GetPostByKeyEndpoint,
    private readonly getPostDiscussion: GetPostDiscussionEndpoint,
    private readonly getPostVoters: GetPostVotersEndpoint,
    private readonly currencyQueries: CurrencyQueryService,
  ) {}

  private buildDeps(): McpToolDeps {
    return {
      search: this.search,
      searchCounts: this.searchCounts,
      discoverObjects: this.discoverObjects,
      discoverUsers: this.discoverUsers,
      discoverTagCategories: this.discoverTagCategories,
      getObjectById: this.getObjectById,
      getNestedObjects: this.getNestedObjects,
      checkObjectExists: this.checkObjectExists,
      getObjectRefList: this.getObjectRefList,
      getObjectRelatedAlbumPreview: this.getObjectRelatedAlbumPreview,
      getObjectRelatedAlbum: this.getObjectRelatedAlbum,
      getObjectFollowers: this.getObjectFollowers,
      getObjectAuthority: this.getObjectAuthority,
      getObjectUpdatesFeed: this.getObjectUpdatesFeed,
      getUpdateVoters: this.getUpdateVoters,
      getUserProfile: this.getUserProfile,
      getUserBlogFeed: this.getUserBlogFeed,
      getUserBlogObjectFilters: this.getUserBlogObjectFilters,
      getUserMentionsFeed: this.getUserMentionsFeed,
      getUserThreadsFeed: this.getUserThreadsFeed,
      getUserCommentsFeed: this.getUserCommentsFeed,
      getUserFollowers: this.getUserFollowers,
      getUserFollowing: this.getUserFollowing,
      getUserFollowingObjects: this.getUserFollowingObjects,
      getUserCategories: this.getUserCategories,
      getUserShopObjects: this.getUserShopObjects,
      getUserShopSections: this.getUserShopSections,
      getPostByKey: this.getPostByKey,
      getPostDiscussion: this.getPostDiscussion,
      getPostVoters: this.getPostVoters,
      currencyQueries: this.currencyQueries,
    };
  }

  private createServer(): McpServer {
    const server = new McpServer(
      { name: 'query-api', version: '1.0.0' },
      {
        capabilities: { tools: {}, resources: {}, prompts: {} },
        instructions: QUERY_API_MCP_INSTRUCTIONS,
      },
    );
    registerAllMcpTools(server, this.buildDeps());
    registerQueryMcpResources(server);
    return server;
  }

  async handle(req: Request, res: Response): Promise<void> {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = this.createServer();

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.logger.error((error as Error).message);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    } finally {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    }
  }
}
