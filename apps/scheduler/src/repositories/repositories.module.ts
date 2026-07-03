import { Module } from '@nestjs/common';
import { PostsRewardRepository } from './posts-reward.repository';
import { SchedulerRepository } from './scheduler.repository';
import { HiveEngineRatesRepository } from './hive-engine-rates.repository';
import { PostObjectsRepository } from './post-objects.repository';
import { PostExpertiseRepository } from './post-expertise.repository';

@Module({
  providers: [
    SchedulerRepository,
    PostsRewardRepository,
    HiveEngineRatesRepository,
    PostObjectsRepository,
    PostExpertiseRepository,
  ],
  exports: [
    SchedulerRepository,
    PostsRewardRepository,
    HiveEngineRatesRepository,
    PostObjectsRepository,
    PostExpertiseRepository,
  ],
})
export class RepositoriesModule {}
