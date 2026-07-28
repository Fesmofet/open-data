import { Module } from '@nestjs/common';
import { ObjectsCoreRepository } from './objects-core.repository';
import { ObjectUpdatesRepository } from './object-updates.repository';
import { ValidityVotesRepository } from './validity-votes.repository';
import { RankVotesRepository } from './rank-votes.repository';
import { AccountsCurrentRepository } from './accounts-current.repository';
import { ObjectAuthorityRepository } from './object-authority.repository';
import { AggregatedObjectRepository } from './aggregated-object.repository';
import { PostsRepository } from './posts.repository';
import { SocialGraphRepository } from './social-graph.repository';
import { ThreadsRepository } from './threads.repository';
import { PostSyncQueueRepository } from './post-sync-queue.repository';
import { AccountSyncQueueRepository } from './account-sync-queue.repository';
import { CanonicalRecomputeRepository } from './canonical-recompute.repository';
import { SiteRegistryRepository } from './site-registry.repository';
import { ObjectCategoriesRepository } from './object-categories.repository';
import { ObjectCategoriesSyncQueueRepository } from './object-categories-sync-queue.repository';
import { ObjectCategoriesRelatedRepository } from './object-categories-related.repository';
import { ObjectCategoriesRelatedSyncQueueRepository } from './object-categories-related-sync-queue.repository';
import { ObjectTagCategoryItemsRepository } from './object-tag-category-items.repository';
import { ObjectTagCategoriesSyncQueueRepository } from './object-tag-categories-sync-queue.repository';
import { UserMetadataRepository } from './user-metadata.repository';
import { UserShopDeselectRepository } from './user-shop-deselect.repository';
import { UserObjectPowersRepository } from './user-object-powers.repository';
import { UserObjectFollowsRepository } from './user-object-follows.repository';
import { PostObjectRelatedImagesRepository } from './post-object-related-images.repository';
import { UserDelegationsRepository } from './user-delegations.repository';
import { UserRcDelegationsRepository } from './user-rc-delegations.repository';
import { HiveEngineSwapsRepository } from './hive-engine-swaps.repository';
import { HiveEngineDepositRecordsRepository } from './hive-engine-deposit-records.repository';
import { OblRepository } from './obl.repository';

@Module({
  providers: [
    ObjectsCoreRepository,
    ObjectUpdatesRepository,
    ValidityVotesRepository,
    RankVotesRepository,
    AccountsCurrentRepository,
    ObjectAuthorityRepository,
    AggregatedObjectRepository,
    PostsRepository,
    SocialGraphRepository,
    ThreadsRepository,
    PostSyncQueueRepository,
    AccountSyncQueueRepository,
    CanonicalRecomputeRepository,
    SiteRegistryRepository,
    ObjectCategoriesRepository,
    ObjectCategoriesSyncQueueRepository,
    ObjectCategoriesRelatedRepository,
    ObjectCategoriesRelatedSyncQueueRepository,
    ObjectTagCategoryItemsRepository,
    ObjectTagCategoriesSyncQueueRepository,
    UserMetadataRepository,
    UserShopDeselectRepository,
    UserObjectPowersRepository,
    UserObjectFollowsRepository,
    PostObjectRelatedImagesRepository,
    UserDelegationsRepository,
    UserRcDelegationsRepository,
    HiveEngineSwapsRepository,
    HiveEngineDepositRecordsRepository,
    OblRepository,
  ],
  exports: [
    ObjectsCoreRepository,
    ObjectUpdatesRepository,
    ValidityVotesRepository,
    RankVotesRepository,
    AccountsCurrentRepository,
    ObjectAuthorityRepository,
    AggregatedObjectRepository,
    PostsRepository,
    SocialGraphRepository,
    ThreadsRepository,
    PostSyncQueueRepository,
    AccountSyncQueueRepository,
    CanonicalRecomputeRepository,
    SiteRegistryRepository,
    ObjectCategoriesRepository,
    ObjectCategoriesSyncQueueRepository,
    ObjectCategoriesRelatedRepository,
    ObjectCategoriesRelatedSyncQueueRepository,
    ObjectTagCategoryItemsRepository,
    ObjectTagCategoriesSyncQueueRepository,
    UserMetadataRepository,
    UserShopDeselectRepository,
    UserObjectPowersRepository,
    UserObjectFollowsRepository,
    PostObjectRelatedImagesRepository,
    UserDelegationsRepository,
    UserRcDelegationsRepository,
    HiveEngineSwapsRepository,
    HiveEngineDepositRecordsRepository,
    OblRepository,
  ],
})
export class RepositoriesModule {}
