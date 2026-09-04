import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';
import { RepositoriesModule } from '../../repositories';
import { UserObjectPowersModule } from '../user-object-powers/user-object-powers.module';
import { RankScoreOwnershipListener } from './rank-score-ownership.listener';
import { RankScoreService } from './rank-score.service';

@Module({
  imports: [RepositoriesModule, GovernanceModule, UserObjectPowersModule],
  providers: [RankScoreService, RankScoreOwnershipListener],
  exports: [RankScoreService],
})
export class RankScoreModule {}
