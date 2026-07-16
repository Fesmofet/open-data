import { Injectable, Logger } from '@nestjs/common';
import { encodeEventSeq } from '@opden-data-layer/core';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import type { OdlActionHandler } from '../odl-shared';
import { dispatchEnvelope } from '../odl-shared';
import { odlEnvelopeSchema } from './odl-envelope.schema';
import { ObjectCreateHandler } from './handlers/object-create.handler';
import { UpdateCreateHandler } from './handlers/update-create.handler';
import { UpdateVoteHandler } from './handlers/update-vote.handler';
import { RankVoteHandler } from './handlers/rank-vote.handler';
import { AuthorityHandler } from './handlers/authority.handler';
import { UserMetadataHandler } from './handlers/user-metadata.handler';
import { ShopDeselectHandler } from './handlers/shop-deselect.handler';
import { BatchImportHandler } from './handlers/batch-import.handler';
import { FollowObjectHandler } from './handlers/follow-object.handler';
import { FollowUserBellHandler } from './handlers/follow-user-bell.handler';
import { GovernanceCacheService } from '../governance/governance-cache.service';

@Injectable()
export class OdlCustomJsonParser {
  private readonly logger = new Logger(OdlCustomJsonParser.name);
  private readonly handlerMap: Record<string, OdlActionHandler>;

  constructor(
    private readonly objectCreateHandler: ObjectCreateHandler,
    private readonly updateCreateHandler: UpdateCreateHandler,
    private readonly updateVoteHandler: UpdateVoteHandler,
    private readonly rankVoteHandler: RankVoteHandler,
    private readonly authorityHandler: AuthorityHandler,
    private readonly userMetadataHandler: UserMetadataHandler,
    private readonly shopDeselectHandler: ShopDeselectHandler,
    private readonly batchImportHandler: BatchImportHandler,
    private readonly followObjectHandler: FollowObjectHandler,
    private readonly followUserBellHandler: FollowUserBellHandler,
    private readonly governanceCache: GovernanceCacheService,
  ) {
    this.handlerMap = {
      [this.objectCreateHandler.action]: this.objectCreateHandler,
      [this.updateCreateHandler.action]: this.updateCreateHandler,
      [this.updateVoteHandler.action]: this.updateVoteHandler,
      [this.rankVoteHandler.action]: this.rankVoteHandler,
      [this.authorityHandler.action]: this.authorityHandler,
      [this.followObjectHandler.action]: this.followObjectHandler,
      [this.followUserBellHandler.action]: this.followUserBellHandler,
      [this.userMetadataHandler.action]: this.userMetadataHandler,
      [this.shopDeselectHandler.action]: this.shopDeselectHandler,
      [this.batchImportHandler.action]: this.batchImportHandler,
    };
  }

  async parse(
    rawJson: string,
    account: string,
    hiveCtx: HiveOperationHandlerContext,
  ): Promise<void> {
    await dispatchEnvelope(rawJson, {
      schema: odlEnvelopeSchema,
      handlerMap: this.handlerMap,
      governanceCache: this.governanceCache,
      logger: this.logger,
      encodeEventSeq,
      hiveCtx,
      account,
      unknownActionLabel: 'ODL: unknown action',
    });
  }
}
