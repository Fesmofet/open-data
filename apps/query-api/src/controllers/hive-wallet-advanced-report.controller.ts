import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAccessGuard, ViewerMatchesJwtGuard } from '../auth';
import { ZodBodyPipe } from '../pipes';
import {
  GetHiveAdvancedReportEndpoint,
  GetHiveAccountCreatedDatesEndpoint,
  UpsertHiveWalletExemptionEndpoint,
  hiveAdvancedReportBodySchema,
  hiveAccountCreatedDatesBodySchema,
  hiveWalletExemptionBodySchema,
  type HiveAdvancedReportBody,
  type HiveAdvancedReportResponse,
  type HiveAccountCreatedDatesBody,
  type HiveAccountCreatedDatesResponse,
  type HiveWalletExemptionBody,
  type HiveWalletExemptionResponse,
} from '../domain/wallet';

@Controller({ path: 'wallet/hive', version: '1' })
export class HiveWalletAdvancedReportController {
  constructor(
    private readonly getAdvancedReport: GetHiveAdvancedReportEndpoint,
    private readonly getAccountCreatedDates: GetHiveAccountCreatedDatesEndpoint,
    private readonly upsertExemption: UpsertHiveWalletExemptionEndpoint,
  ) {}

  @Post('advanced-report')
  @UseGuards(JwtAccessGuard, ViewerMatchesJwtGuard)
  async advancedReport(
    @Body(new ZodBodyPipe(hiveAdvancedReportBodySchema)) body: HiveAdvancedReportBody,
  ): Promise<HiveAdvancedReportResponse> {
    return this.getAdvancedReport.execute(body);
  }

  @Post('account-created-dates')
  async accountCreatedDates(
    @Body(new ZodBodyPipe(hiveAccountCreatedDatesBodySchema))
    body: HiveAccountCreatedDatesBody,
  ): Promise<HiveAccountCreatedDatesResponse> {
    return this.getAccountCreatedDates.execute(body);
  }

  @Post('exemptions')
  @UseGuards(JwtAccessGuard, ViewerMatchesJwtGuard)
  async exemptions(
    @Body(new ZodBodyPipe(hiveWalletExemptionBodySchema)) body: HiveWalletExemptionBody,
  ): Promise<HiveWalletExemptionResponse> {
    return this.upsertExemption.execute(body);
  }
}
