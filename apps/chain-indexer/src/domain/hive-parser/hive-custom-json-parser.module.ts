import { Module } from '@nestjs/common';
import { OdlParserModule } from '../odl-parser/odl-parser.module';
import { HiveSocialModule } from '../hive-social/hive-social.module';
import { HiveDelegationModule } from '../hive-delegation/hive-delegation.module';
import { HiveCustomJsonParser } from './hive-custom-json-parser';

@Module({
  imports: [OdlParserModule, HiveSocialModule, HiveDelegationModule],
  providers: [HiveCustomJsonParser],
  exports: [HiveCustomJsonParser],
})
export class HiveCustomJsonParserModule {}
