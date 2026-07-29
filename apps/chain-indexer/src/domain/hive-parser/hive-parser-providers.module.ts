import { Module } from '@nestjs/common';

import { HiveMainParser } from './hive-main-parser';
import { hiveOperationHandlersProvider } from './hive-operation-handlers.provider';
import { HiveCustomJsonParserModule } from './hive-custom-json-parser.module';
import { HiveCommentParserModule } from '../hive-comment/hive-comment-parser.module';
import { HiveSocialModule } from '../hive-social/hive-social.module';
import { HiveVoteModule } from '../hive-vote/hive-vote.module';
import { HiveDelegationModule } from '../hive-delegation/hive-delegation.module';
import { HiveWalletModule } from '../hive-wallet/hive-wallet.module';
import { BLOCK_PARSER } from '@opden-data-layer/hive-processor';

@Module({
  imports: [
    HiveCustomJsonParserModule,
    HiveCommentParserModule,
    HiveSocialModule,
    HiveVoteModule,
    HiveDelegationModule,
    HiveWalletModule,
  ],
  providers: [
    HiveMainParser,
    hiveOperationHandlersProvider,
    { provide: BLOCK_PARSER, useExisting: HiveMainParser },
  ],
  exports: [BLOCK_PARSER],
})
export class HiveParserProvidersModule {}
