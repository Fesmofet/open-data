import { Injectable, Logger } from '@nestjs/common';
import { encodeEventSeq } from '@opden-data-layer/core';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { dispatchEnvelope } from '../odl-shared';
import type { OdlActionHandler } from '../odl-shared';
import { GovernanceCacheService } from '../governance/governance-cache.service';
import { oslEnvelopeSchema } from './osl-envelope.schema';
import { HiveEngineDepositHandler } from './handlers/hive-engine-deposit.handler';

@Injectable()
export class OslCustomJsonParser {
  private readonly logger = new Logger(OslCustomJsonParser.name);
  private readonly handlerMap: Record<string, OdlActionHandler>;

  constructor(
    private readonly hiveEngineDepositHandler: HiveEngineDepositHandler,
    private readonly governanceCache: GovernanceCacheService,
  ) {
    this.handlerMap = {
      [this.hiveEngineDepositHandler.action]: this.hiveEngineDepositHandler,
    };
  }

  async parse(
    rawJson: string,
    account: string,
    hiveCtx: HiveOperationHandlerContext,
  ): Promise<void> {
    await dispatchEnvelope(rawJson, {
      schema: oslEnvelopeSchema,
      handlerMap: this.handlerMap,
      governanceCache: this.governanceCache,
      logger: this.logger,
      encodeEventSeq,
      hiveCtx,
      account,
      unknownActionLabel: 'OSL: unknown action',
    });
  }
}
