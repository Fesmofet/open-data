import { Body, Controller, Post } from '@nestjs/common';

import { ZodBodyPipe } from '../pipes';
import {
  GetHiveAdvancedReportEndpoint,
  UpsertHiveWalletExemptionEndpoint,
  hiveAdvancedReportBodySchema,
  hiveWalletExemptionBodySchema,
  type HiveAdvancedReportBody,
  type HiveAdvancedReportResponse,
  type HiveWalletExemptionBody,
  type HiveWalletExemptionResponse,
} from '../domain/wallet';

@Controller({ path: 'wallet/hive', version: '1' })
export class HiveWalletAdvancedReportController {
  constructor(
    private readonly getAdvancedReport: GetHiveAdvancedReportEndpoint,
    private readonly upsertExemption: UpsertHiveWalletExemptionEndpoint,
  ) {}

  @Post('advanced-report')
  async advancedReport(
    @Body(new ZodBodyPipe(hiveAdvancedReportBodySchema)) body: HiveAdvancedReportBody,
  ): Promise<HiveAdvancedReportResponse> {
    return this.getAdvancedReport.execute(body);
  }

  @Post('exemptions')
  async exemptions(
    @Body(new ZodBodyPipe(hiveWalletExemptionBodySchema)) body: HiveWalletExemptionBody,
  ): Promise<HiveWalletExemptionResponse> {
    return this.upsertExemption.execute(body);
  }
}
