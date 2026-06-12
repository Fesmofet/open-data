import { Module } from '@nestjs/common';
import { PostsRewardRepository } from './posts-reward.repository';
import { SchedulerRepository } from './scheduler.repository';

@Module({
  providers: [SchedulerRepository, PostsRewardRepository],
  exports: [SchedulerRepository, PostsRewardRepository],
})
export class RepositoriesModule {}
