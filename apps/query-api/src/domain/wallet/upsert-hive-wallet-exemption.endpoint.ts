import { Injectable } from '@nestjs/common';

import { WalletExemptionsRepository } from '../../repositories';
import type {
  HiveWalletExemptionBody,
  HiveWalletExemptionResponse,
} from './schemas/hive-advanced-report.schema';

@Injectable()
export class UpsertHiveWalletExemptionEndpoint {
  constructor(private readonly exemptions: WalletExemptionsRepository) {}

  async execute(body: HiveWalletExemptionBody): Promise<HiveWalletExemptionResponse> {
    const viewer = body.viewer.trim().toLowerCase();
    const account = body.account.trim().toLowerCase();

    const result = body.checked
      ? await this.exemptions.upsertExemption({
          viewer,
          account,
          operationIndex: body.operationIndex,
        })
      : await this.exemptions.deleteExemption({
          viewer,
          account,
          operationIndex: body.operationIndex,
        });

    return { result };
  }
}
